import sys

pdf_path = r'D:\Antigravity\Jackypotato\GTM\Ceramic_Voices_Marketing_Plan.pdf'

# Try method 1: PyPDF2
try:
    import PyPDF2
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        print(text)
        sys.exit(0)
except Exception as e:
    pass

# Try method 2: pdfplumber
try:
    import pdfplumber
    with pdfplumber.open(pdf_path) as pdf:
        text = ''
        for page in pdf.pages:
            text += page.extract_text() + '\n'
        print(text)
        sys.exit(0)
except Exception as e:
    pass

# Try method 3: pdfminer
try:
    from pdfminer.high_level import extract_text
    text = extract_text(pdf_path)
    print(text)
    sys.exit(0)
except Exception as e:
    pass

print("ERROR: No PDF library available.")
sys.exit(1)
