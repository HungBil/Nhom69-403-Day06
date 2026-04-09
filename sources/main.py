import os
from dotenv import load_dotenv
from src.agent import run_agent

def main():
    load_dotenv()
    print("Welcome to the AI Agent Chatbot!")
    print("Type 'exit' or 'quit' to stop.")
    print("-" * 50)
    
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break
            
        if not user_input.strip():
            continue
            
        try:
            print("\nAgent: ", end="", flush=True)
            response = run_agent(user_input)
            print(response)
        except Exception as e:
            print(f"\n[Error]: {e}")

if __name__ == "__main__":
    main()
