import zipfile
import xml.etree.ElementTree as ET
import os

def extract_to_file(docx_path, output_path):
    try:
        document = zipfile.ZipFile(docx_path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.fromstring(xml_content)
        
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for paragraph in tree.findall('.//w:p', ns):
            texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
            if texts:
                paragraphs.append("".join(texts))
            else:
                paragraphs.append("")
        
        content = "\n".join(paragraphs)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return "Success"
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    docx_file = r"D:\Antigravity\Jackypotato\potatoblog\posts\why smart people.docx"
    output_file = r"D:\Antigravity\Jackypotato\skills\Louis Gleeson\full_content.txt"
    print(extract_to_file(docx_file, output_file))
