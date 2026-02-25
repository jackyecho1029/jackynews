import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def get_docx_text(path):
    try:
        if not os.path.exists(path):
            return f"Error: File not found at {path}"
            
        document = zipfile.ZipFile(path)
        all_text = []
        
        # Namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        # List of files that might contain text
        possible_files = ['word/document.xml', 'word/footer1.xml', 'word/footer2.xml', 'word/header1.xml', 'word/header2.xml']
        
        for xml_file in possible_files:
            if xml_file in document.namelist():
                xml_content = document.read(xml_file)
                tree = ET.fromstring(xml_content)
                
                paragraphs = []
                for paragraph in tree.findall('.//w:p', ns):
                    texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
                    if texts:
                        paragraphs.append("".join(texts))
                    else:
                        paragraphs.append("")
                
                all_text.append(f"--- {xml_file} ---")
                all_text.append("\n".join(paragraphs))
        
        document.close()
        return "\n\n".join(all_text)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        sys.stdout.reconfigure(encoding='utf-8')
        print(get_docx_text(sys.argv[1]))
    else:
        print("Error: No file path provided")
