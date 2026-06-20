from langchain_text_splitters import RecursiveCharacterTextSplitter

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000,
    chunk_overlap=500
)

def chunk_files(files: list) -> list:
    all_chunks = []

    for file in files:
        chunks = text_splitter.split_text(file["content"])

        for chunk in chunks:
            all_chunks.append({
                "text": chunk,
                "metadata": {
                    "file_path": file["path"]
                }
            })

    return all_chunks

