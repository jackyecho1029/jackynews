import zipfile
import sys
import os

def list_docx_contents(path):
    try:
        if not os.path.exists(path):
            return f"Error: File not found at {path}"
            
        document = zipfile.ZipFile(path)
        info_list = document.infolist()
        document.close()
        
        result = []
        for info in info_list:
            result.append(f"{info.filename:50} {info.file_size:10}")
        
        return "\n".join(result)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        print(list_docx_contents(sys.argv[1]))
    else:
        print("Error: No file path provided")
