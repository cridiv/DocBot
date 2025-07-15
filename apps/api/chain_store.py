
from typing import Dict
from langchain.chains import ConversationalRetrievalChain

chain_store: Dict[str, ConversationalRetrievalChain] = {}
