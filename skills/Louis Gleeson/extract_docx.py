import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def get_docx_text(path):
    try:
        if not os.path.exists(path):
            return f"Error: File not found at {path}"
            
        document = zipfile.ZipFile(path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.fromstring(xml_content)
        
        # Namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        # Extract all text elements
        text_elements = tree.findall('.//w:t', ns)
        
        # However, we want to preserve paragraph breaks
        # So we iterate through paragraphs
        paragraphs = []
        for paragraph in tree.findall('.//w:p', ns):
            texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
            if texts:
                paragraphs.append("".join(texts))
            else:
                # Add empty line for empty paragraphs
                paragraphs.append("")
        
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Use utf-8 for output
        sys.stdout.reconfigure(encoding='utf-8')
        print(get_docx_text(sys.argv[1]))
    else:
        print("Error: No file path provided")
