#define _WIN32_DCOM
#include <windows.h>
#include <imapi2.h>
#include <shlwapi.h>
#include <wrl/client.h>
#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <filesystem>

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "shlwapi.lib")

using Microsoft::WRL::ComPtr;

static void hrmsg(const wchar_t* where, HRESULT hr) {
    wchar_t* msg = nullptr;
    FormatMessageW(FORMAT_MESSAGE_ALLOCATE_BUFFER|FORMAT_MESSAGE_FROM_SYSTEM|FORMAT_MESSAGE_IGNORE_INSERTS,
                   nullptr, hr, 0, (LPWSTR)&msg, 0, nullptr);
    std::wcerr << L"[FAIL] " << where << L" HRESULT=0x" << std::hex << std::uppercase << (unsigned long)hr << std::dec;
    if (msg) { std::wcerr << L" - " << msg; LocalFree(msg); }
    std::wcerr << L"\n";
}
#define CHECK_HR(expr, label) do { HRESULT _hr=(expr); if(FAILED(_hr)){hrmsg(label,_hr); return 1;} } while(0)

#pragma pack(push,1)
struct RiffHeader { char riff[4]; uint32_t size; char wave[4]; };
struct ChunkHeader { char id[4]; uint32_t size; };
struct FmtPCM { uint16_t format, channels; uint32_t sampleRate, byteRate; uint16_t blockAlign, bits; };
#pragma pack(pop)

static bool loadWavPcm(const std::wstring& path, std::vector<unsigned char>& pcm) {
    std::ifstream f(path, std::ios::binary);
    if(!f) { std::wcerr << L"[FAIL] Cannot open " << path << L"\n"; return false; }
    RiffHeader rh{}; f.read((char*)&rh,sizeof(rh));
    if(!f || memcmp(rh.riff,"RIFF",4)||memcmp(rh.wave,"WAVE",4)) { std::wcerr<<L"[FAIL] Not RIFF/WAVE: "<<path<<L"\n"; return false; }
    bool fmtOk=false, dataOk=false;
    while(f && !(fmtOk&&dataOk)) {
        ChunkHeader ch{}; f.read((char*)&ch,sizeof(ch)); if(!f) break;
        if(!memcmp(ch.id,"fmt ",4)) {
            if(ch.size < sizeof(FmtPCM)) return false;
            FmtPCM fmt{}; f.read((char*)&fmt,sizeof(fmt));
            if(ch.size>sizeof(fmt)) f.seekg(ch.size-sizeof(fmt),std::ios::cur);
            if(fmt.format!=1 || fmt.channels!=2 || fmt.sampleRate!=44100 || fmt.bits!=16) {
                std::wcerr << L"[FAIL] WAV must be PCM, 44.1 kHz, 16-bit, stereo: "<<path<<L"\n"; return false;
            }
            fmtOk=true;
        } else if(!memcmp(ch.id,"data",4)) {
            pcm.resize(ch.size); f.read((char*)pcm.data(),ch.size); dataOk=(bool)f;
        } else f.seekg(ch.size,std::ios::cur);
        if(ch.size&1) f.seekg(1,std::ios::cur);
    }
    if(!fmtOk||!dataOk) { std::wcerr<<L"[FAIL] Missing fmt/data chunk: "<<path<<L"\n"; return false; }
    size_t rem=pcm.size()%2352; if(rem) pcm.resize(pcm.size()+(2352-rem),0);
    return true;
}

static bool writePcmFile(const std::wstring& path, const std::vector<unsigned char>& bytes) {
    std::ofstream f(std::filesystem::path(path), std::ios::binary | std::ios::trunc);
    if (!f) return false;
    f.write(reinterpret_cast<const char*>(bytes.data()), static_cast<std::streamsize>(bytes.size()));
    return static_cast<bool>(f);
}

static HRESULT streamFromFile(const std::wstring& path, ComPtr<IStream>& out) {
    IStream* raw = nullptr;
    HRESULT hr = SHCreateStreamOnFileEx(path.c_str(), STGM_READ | STGM_SHARE_DENY_WRITE,
        FILE_ATTRIBUTE_NORMAL, FALSE, nullptr, &raw);
    if (FAILED(hr)) return hr;
    out.Attach(raw);
    LARGE_INTEGER zero{}; ULARGE_INTEGER pos{};
    hr = out->Seek(zero, STREAM_SEEK_SET, &pos);
    if (FAILED(hr)) return hr;
    if (pos.QuadPart != 0) return E_FAIL;
    return S_OK;
}

static void reportStream(IStream* stream) {
    STATSTG st{}; HRESULT hr = stream->Stat(&st, STATFLAG_NONAME);
    if (SUCCEEDED(hr)) std::wcout << L"    IStream size: " << st.cbSize.QuadPart << L" bytes (" << (st.cbSize.QuadPart / 2352) << L" CD-DA sectors)\n";
    else hrmsg(L"IStream::Stat", hr);
}

static std::wstring bstrToW(BSTR b){ return b ? std::wstring(b, SysStringLen(b)) : L""; }

int wmain() {
    std::wcout << L"Simple Audio CD IMAPI2 Test\n===========================\n\n";
    CHECK_HR(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED), L"CoInitializeEx");
    ComPtr<IDiscMaster2> master;
    CHECK_HR(CoCreateInstance(__uuidof(MsftDiscMaster2),nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&master)), L"Create MsftDiscMaster2");
    LONG count=0; CHECK_HR(master->get_Count(&count),L"Enumerate recorders");
    std::wcout<<L"Recorders found: "<<count<<L"\n";
    if(count<1){std::wcerr<<L"[FAIL] No optical recorder found.\n"; CoUninitialize(); return 1;}
    std::vector<ComPtr<IDiscRecorder2>> recorders;
    for(LONG i=0;i<count;i++){
        BSTR uid=nullptr; CHECK_HR(master->get_Item(i,&uid),L"Get recorder ID");
        ComPtr<IDiscRecorder2> r; HRESULT hr=CoCreateInstance(__uuidof(MsftDiscRecorder2),nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&r));
        if(SUCCEEDED(hr)) hr=r->InitializeDiscRecorder(uid); SysFreeString(uid);
        if(FAILED(hr)){hrmsg(L"Initialize recorder",hr);continue;}
        BSTR vendor=nullptr, product=nullptr, rev=nullptr; r->get_VendorId(&vendor); r->get_ProductId(&product); r->get_ProductRevision(&rev);
        std::wcout<<L"["<<recorders.size()<<L"] "<<bstrToW(vendor)<<L" "<<bstrToW(product)<<L" "<<bstrToW(rev)<<L"\n";
        SysFreeString(vendor);SysFreeString(product);SysFreeString(rev); recorders.push_back(r);
    }
    if(recorders.empty()){CoUninitialize();return 1;}
    size_t choice=0;
    if(recorders.size()>1){std::wcout<<L"Choose recorder [0-"<<recorders.size()-1<<L"]: ";std::wcin>>choice; if(choice>=recorders.size())choice=0;}
    auto recorder=recorders[choice];
    ComPtr<IDiscFormat2TrackAtOnce> tao;
    CHECK_HR(CoCreateInstance(__uuidof(MsftDiscFormat2TrackAtOnce),nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&tao)), L"Create Track-At-Once writer");
    VARIANT_BOOL supported=VARIANT_FALSE; CHECK_HR(tao->IsRecorderSupported(recorder.Get(),&supported),L"Check recorder support");
    if(supported!=VARIANT_TRUE){std::wcerr<<L"[FAIL] Selected recorder does not support IMAPI2 Track-At-Once audio.\n";CoUninitialize();return 1;}
    std::wcout<<L"[OK] Recorder supports IMAPI2 Track-At-Once audio\n";
    CHECK_HR(tao->put_Recorder(recorder.Get()),L"Set recorder");
    BSTR clientName = SysAllocString(L"Simple Audio CD Test");
    if (!clientName) { std::wcerr << L"[FAIL] Could not allocate IMAPI client name.\n"; CoUninitialize(); return 1; }
    HRESULT clientHr = tao->put_ClientName(clientName); SysFreeString(clientName);
    if (FAILED(clientHr)) { hrmsg(L"Set client name", clientHr); CoUninitialize(); return 1; }
    std::wcout << L"[OK] Recorder and client configured\n";
    VARIANT_BOOL mediaSupported=VARIANT_FALSE; HRESULT mh=tao->IsCurrentMediaSupported(recorder.Get(),&mediaSupported);
    if(FAILED(mh)){hrmsg(L"Check current media",mh);CoUninitialize();return 1;}
    if(mediaSupported!=VARIANT_TRUE){std::wcerr<<L"[FAIL] Insert a blank writable CD-R/CD-RW supported for audio TAO.\n";CoUninitialize();return 1;}
    VARIANT_BOOL blank=VARIANT_FALSE; tao->get_MediaPhysicallyBlank(&blank);
    std::wcout<<(blank==VARIANT_TRUE?L"[OK] Media reports physically blank\n":L"[WARN] Media does not report physically blank\n");
    std::vector<std::wstring> paths={L"test-audio\\01.wav",L"test-audio\\02.wav"};
    std::vector<std::vector<unsigned char>> tracks;
    for(auto& p:paths){std::vector<unsigned char> pcm;if(!loadWavPcm(p,pcm)){CoUninitialize();return 1;} std::wcout<<L"[OK] "<<p<<L" -> "<<(pcm.size()/176400.0)<<L" sec PCM\n";tracks.push_back(std::move(pcm));}
    std::wcout<<L"\nWARNING: The next step will WRITE to the inserted disc.\nType BURN to continue: ";
    std::wstring confirm;std::wcin>>confirm;if(confirm!=L"BURN"){std::wcout<<L"Cancelled.\n";CoUninitialize();return 0;}
    HRESULT hr=tao->PrepareMedia(); if(FAILED(hr)){hrmsg(L"PrepareMedia",hr);CoUninitialize();return 1;}
    std::wcout<<L"[OK] Media prepared and locked\n";
    std::filesystem::create_directories(L"test-output");
    std::vector<std::wstring> pcmPaths;
    for (size_t i = 0; i < tracks.size(); ++i) {
        std::wstring p = L"test-output\\track-" + std::to_wstring(i + 1) + L".pcm";
        if (!writePcmFile(p, tracks[i])) { std::wcerr << L"[FAIL] Could not write diagnostic PCM file: " << p << L"\n"; tao->ReleaseMedia(); CoUninitialize(); return 1; }
        pcmPaths.push_back(p);
        std::wcout << L"[OK] Raw PCM prepared: " << p << L" -> " << tracks[i].size() << L" bytes / " << (tracks[i].size()/2352) << L" sectors" << (tracks[i].size()%2352==0 ? L" [sector aligned]\n" : L" [NOT ALIGNED]\n");
    }
    LONG freeBefore = 0; if (SUCCEEDED(tao->get_FreeSectorsOnMedia(&freeBefore))) std::wcout << L"[INFO] Free sectors before track 1: " << freeBefore << L"\n";
    bool failed=false;
    for(size_t i=0;i<tracks.size();i++){
        ComPtr<IStream> s; hr=streamFromFile(pcmPaths[i],s);
        if(FAILED(hr)){hrmsg(L"Open raw PCM as Windows IStream",hr);failed=true;break;}
        reportStream(s.Get()); std::wcout<<L"Burning track "<<i+1<<L"...\n";
        hr=tao->AddAudioTrack(s.Get());
        if(FAILED(hr)){hrmsg(L"AddAudioTrack",hr); LONG freeAfterFail=0; if(SUCCEEDED(tao->get_FreeSectorsOnMedia(&freeAfterFail))) std::wcout << L"[INFO] Free sectors after failure: " << freeAfterFail << L"\n"; failed=true;break;}
        std::wcout<<L"[OK] Track "<<i+1<<L" written\n"; LONG freeAfter=0;
        if(SUCCEEDED(tao->get_FreeSectorsOnMedia(&freeAfter))) std::wcout << L"[INFO] Free sectors after track " << i+1 << L": " << freeAfter << L"\n";
    }
    HRESULT rel=tao->ReleaseMedia(); if(FAILED(rel)) hrmsg(L"ReleaseMedia/finalize",rel); else std::wcout<<L"[OK] Media released/finalized\n";
    if(!failed && SUCCEEDED(rel)){HRESULT ej=recorder->EjectMedia(); if(FAILED(ej))hrmsg(L"EjectMedia",ej); else std::wcout<<L"[OK] Disc ejected\n\nAUDIO CD TEST COMPLETE\n";}
    CoUninitialize(); return failed?1:0;
}
