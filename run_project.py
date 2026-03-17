import subprocess
import time
import sys
import os

def run_system():
    print("====================================")
    print("   Starting AI Attendance System")
    print("====================================\n")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    is_windows = sys.platform.startswith('win')

    venv_python_win = os.path.join(base_dir, "backend", "venv", "Scripts", "python.exe")
    venv_python_unix = os.path.join(base_dir, "backend", "venv", "bin", "python")
    
    if os.path.exists(venv_python_win):
        python_executable = venv_python_win
    elif os.path.exists(venv_python_unix):
        python_executable = venv_python_unix
    else:
        python_executable = sys.executable

    print(f">>> Using Python: {python_executable}")

    print(">>> Starting FastAPI backend...")
    backend_cmd = [python_executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
    try:
        backend_process = subprocess.Popen(backend_cmd, cwd=backend_dir)
    except Exception as e:
        print(f"Failed to start backend: {e}")
        sys.exit(1)
        
    print(">>> Waiting 3 seconds for backend to initialize...")
    time.sleep(3)
    
    # Check if backend crashed immediately
    if backend_process.poll() is not None:
        print("Backend failed to start. Exiting.")
        sys.exit(1)
        
    # Start React Frontend
    print(">>> Starting React frontend...")
    frontend_cmd = "npm run dev" if is_windows else ["npm", "run", "dev"]
    try:
        frontend_process = subprocess.Popen(frontend_cmd, cwd=frontend_dir, shell=is_windows)
    except Exception as e:
        print(f"Failed to start frontend: {e}")
        backend_process.terminate()
        sys.exit(1)
        
    print("\n" + "="*40)
    print("   System is running successfully!")
    print("="*40)
    print("Frontend -> http://localhost:5173")
    print("Backend  -> http://localhost:8000")
    print("API Docs -> http://localhost:8000/docs\n")
    print("Press Ctrl+C to stop both services.")
    print("="*40 + "\n")
    
    try:
        # Wait for both processes
        while True:
            # If either process stops, terminate the other and exit
            if backend_process.poll() is not None:
                print("\n[WARNING] Backend server stopped unexpectedly.")
                frontend_process.terminate()
                break
            if frontend_process.poll() is not None:
                print("\n[WARNING] Frontend server stopped unexpectedly.")
                backend_process.terminate()
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping services gracefully...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Services stopped.")

if __name__ == "__main__":
    run_system()
