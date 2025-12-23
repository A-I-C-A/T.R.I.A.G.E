# How to Fix PowerShell Script Execution

## Quick Fix (Recommended)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then type `Y` and press Enter.

## Alternative: Run Without Changing Policy

Instead of using the .ps1 script, run the commands directly:

```powershell
# Install dependencies (if needed)
npm install
cd client
npm install
cd ..

# Start both servers
npm run dev
```

This runs both backend and frontend with one command!

## Or Start Manually:

### Terminal 1 - Backend:
```powershell
npm run dev:backend
```

### Terminal 2 - Frontend:
```powershell
npm run dev:client
```

## After Fixing:

Once execution policy is set, you can use:
```powershell
.\start-dev.ps1
```

This automatically:
- Checks dependencies
- Kills processes on ports 3000 and 5173
- Starts both servers concurrently
