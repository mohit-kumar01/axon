import clamd

def main():
    try:
        # Connect to ClamAV in Docker
        cd = clamd.ClamdNetworkSocket(host='localhost', port=3310)
        print(f"ClamAV Daemon Response: {cd.ping()}")
    except Exception as e:
        print(f"Could not connect to ClamAV: {e}")
        return

    # File to scan (update path if needed)
    file_to_scan = "/scan/eicar.txt"

    try:
        result = cd.scan(file_to_scan)
        print("Scan Result:", result)
    except Exception as e:
        print(f"Error scanning file: {e}")

if __name__ == "__main__":
    main()
