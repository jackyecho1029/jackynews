import zipfile
import sys
import os
import json

def inspect_docx(path):
    try:
        if not os.path.exists(path):
            return {"error": f"File not found at {path}"}
            
        # Check first 4 bytes for PK\x03\x04
        with open(path, 'rb') as f:
            header = f.read(4)
            is_zip = header == b'PK\x03\x04'
            
        document = zipfile.ZipFile(path)
        info_list = document.infolist()
        document.close()
        
        files = []
        for info in info_list:
            files.append({
                "filename": info.filename,
                "size": info.file_size,
                "compress_size": info.compress_size
            })
        
        return {
            "is_zip": is_zip,
            "header": header.hex(),
            "files": files
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(json.dumps(inspect_docx(sys.argv[1]), indent=2))
    else:
        print(json.dumps({"error": "No file path provided"}))
