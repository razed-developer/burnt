#define _WIN32_DCOM
#include <windows.h>
#include <imapi2.h>
#include <shlwapi.h>
#include <wrl/client.h>
#include <iostream>
#include <vector>
#include <string>
#include <filesystem>

#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "shlwapi.lib")

using Microsoft::WRL::ComPtr;

static void emit(const wchar_t* type, const std::wstring& message) {
    std::wcout << type << L"|" << message << L"\n";
    std::wcout.flush();
}

static std::wstring hr_text(HRESULT hr) {
    wchar_t* msg = nullptr;
    FormatMessageW(FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
                   nullptr, hr, 0, (LPWSTR)&msg, 0, nullptr);
    std::wstring out = L"HRESULT 0x";
    wchar_t hex[16]{};
    swprintf_s(hex, L"%08lX", static_cast<unsigned long>(hr));
    out += hex;
    if (msg) { out += L" - "; out += msg; LocalFree(msg); }
    while (!out.empty() && (out.back() == L'\r' || out.back() == L'\n')) out.pop_back();
    return out;
}

static std::wstring bstr_to_w(BSTR b) { return b ? std::wstring(b, SysStringLen(b)) : L""; }

static HRESULT stream_from_file(const std::wstring& path, ComPtr<IStream>& out) {
    IStream* raw = nullptr;
    HRESULT hr = SHCreateStreamOnFileEx(path.c_str(), STGM_READ | STGM_SHARE_DENY_WRITE,
        FILE_ATTRIBUTE_NORMAL, FALSE, nullptr, &raw);
    if (FAILED(hr)) return hr;
    out.Attach(raw);
    LARGE_INTEGER zero{};
    ULARGE_INTEGER pos{};
    hr = out->Seek(zero, STREAM_SEEK_SET, &pos);
    if (FAILED(hr)) return hr;
    return pos.QuadPart == 0 ? S_OK : E_FAIL;
}

static int fail(const std::wstring& message) {
    emit(L"ERROR", message);
    return 1;
}

static int burn(const std::vector<std::wstring>& pcm_paths) {
    if (pcm_paths.empty()) return fail(L"No prepared PCM tracks were supplied.");
    HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    if (FAILED(hr)) return fail(L"Could not initialize Windows COM: " + hr_text(hr));

    int result = 1;
    ComPtr<IDiscMaster2> master;
    hr = CoCreateInstance(__uuidof(MsftDiscMaster2), nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&master));
    if (FAILED(hr)) { result = fail(L"Could not create IMAPI2 disc master: " + hr_text(hr)); goto done; }

    LONG count = 0;
    hr = master->get_Count(&count);
    if (FAILED(hr)) { result = fail(L"Could not enumerate optical recorders: " + hr_text(hr)); goto done; }
    if (count < 1) { result = fail(L"No optical recorder was found."); goto done; }

    {
        ComPtr<IDiscRecorder2> recorder;
        BSTR uid = nullptr;
        hr = master->get_Item(0, &uid);
        if (FAILED(hr)) { result = fail(L"Could not get optical recorder: " + hr_text(hr)); goto done; }
        hr = CoCreateInstance(__uuidof(MsftDiscRecorder2), nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&recorder));
        if (SUCCEEDED(hr)) hr = recorder->InitializeDiscRecorder(uid);
        SysFreeString(uid);
        if (FAILED(hr)) { result = fail(L"Could not initialize optical recorder: " + hr_text(hr)); goto done; }

        BSTR vendor = nullptr, product = nullptr, rev = nullptr;
        recorder->get_VendorId(&vendor); recorder->get_ProductId(&product); recorder->get_ProductRevision(&rev);
        emit(L"DRIVE", bstr_to_w(vendor) + L" " + bstr_to_w(product) + L" " + bstr_to_w(rev));
        SysFreeString(vendor); SysFreeString(product); SysFreeString(rev);

        ComPtr<IDiscFormat2TrackAtOnce> tao;
        hr = CoCreateInstance(__uuidof(MsftDiscFormat2TrackAtOnce), nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&tao));
        if (FAILED(hr)) { result = fail(L"Could not create IMAPI2 Track-at-Once writer: " + hr_text(hr)); goto done; }

        VARIANT_BOOL supported = VARIANT_FALSE;
        hr = tao->IsRecorderSupported(recorder.Get(), &supported);
        if (FAILED(hr) || supported != VARIANT_TRUE) { result = fail(L"Selected recorder does not support IMAPI2 Audio CD Track-at-Once."); goto done; }
        hr = tao->put_Recorder(recorder.Get());
        if (FAILED(hr)) { result = fail(L"Could not select optical recorder: " + hr_text(hr)); goto done; }
        BSTR client = SysAllocString(L"Burnt");
        hr = client ? tao->put_ClientName(client) : E_OUTOFMEMORY;
        if (client) SysFreeString(client);
        if (FAILED(hr)) { result = fail(L"Could not configure Burnt as IMAPI client: " + hr_text(hr)); goto done; }

        VARIANT_BOOL media_supported = VARIANT_FALSE;
        hr = tao->IsCurrentMediaSupported(recorder.Get(), &media_supported);
        if (FAILED(hr) || media_supported != VARIANT_TRUE) { result = fail(L"Insert a supported blank writable CD-R or CD-RW."); goto done; }
        VARIANT_BOOL blank = VARIANT_FALSE;
        hr = tao->get_MediaPhysicallyBlank(&blank);
        if (FAILED(hr) || blank != VARIANT_TRUE) { result = fail(L"The inserted disc is not physically blank."); goto done; }

        LONG free_sectors = 0;
        if (SUCCEEDED(tao->get_FreeSectorsOnMedia(&free_sectors))) {
            unsigned long long needed = 0;
            for (const auto& path : pcm_paths) {
                std::error_code ec;
                auto bytes = std::filesystem::file_size(path, ec);
                if (ec || bytes == 0 || bytes % 2352 != 0) { result = fail(L"Prepared PCM is missing or not CD-sector aligned: " + path); goto done; }
                needed += bytes / 2352;
            }
            // TAO consumes approximately two seconds between tracks. Leave a small safety margin.
            needed += pcm_paths.size() > 1 ? (pcm_paths.size() - 1) * 150ULL : 0ULL;
            if (needed > static_cast<unsigned long long>(free_sectors)) { result = fail(L"The prepared tracks do not fit on the inserted disc."); goto done; }
        }

        emit(L"STATUS", L"Preparing media");
        hr = tao->PrepareMedia();
        if (FAILED(hr)) { result = fail(L"Could not prepare/lock the disc: " + hr_text(hr)); goto done; }

        bool failed = false;
        for (size_t i = 0; i < pcm_paths.size(); ++i) {
            ComPtr<IStream> stream;
            hr = stream_from_file(pcm_paths[i], stream);
            if (FAILED(hr)) { emit(L"ERROR", L"Could not open prepared PCM track: " + hr_text(hr)); failed = true; break; }
            emit(L"TRACK", std::to_wstring(i + 1) + L"/" + std::to_wstring(pcm_paths.size()));
            hr = tao->AddAudioTrack(stream.Get());
            if (FAILED(hr)) { emit(L"ERROR", L"Could not write track " + std::to_wstring(i + 1) + L": " + hr_text(hr)); failed = true; break; }
        }

        emit(L"STATUS", L"Finalizing disc");
        HRESULT release_hr = tao->ReleaseMedia();
        if (FAILED(release_hr)) { emit(L"ERROR", L"Could not finalize/release the disc: " + hr_text(release_hr)); failed = true; }
        if (failed) { result = 1; goto done; }

        hr = recorder->EjectMedia();
        if (FAILED(hr)) emit(L"WARN", L"Disc was written but could not be ejected: " + hr_text(hr));
        emit(L"COMPLETE", L"Audio CD written successfully");
        result = 0;
    }

done:
    CoUninitialize();
    return result;
}

int wmain(int argc, wchar_t** argv) {
    if (argc < 3 || std::wstring(argv[1]) != L"burn") {
        std::wcerr << L"Usage: burnt-burner.exe burn <track-1.pcm> [track-2.pcm ...]\n";
        return 2;
    }
    std::vector<std::wstring> paths;
    for (int i = 2; i < argc; ++i) paths.emplace_back(argv[i]);
    return burn(paths);
}
