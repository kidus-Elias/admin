const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;
let authToken = null; // Store the admin token

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'scripts', 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'views', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Backend Base URL
const BASE_URL = 'https://productivity-tracker-backend-sbby.onrender.com/api';

// IPC Handlers
ipcMain.handle('admin-login', async (event, credentials) => {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
        authToken = response.data.token; // Save the token
        return { token: authToken };
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        throw new Error('Failed to login. Check your credentials.');
    }
});

ipcMain.handle('fetch-employees', async () => {
    try {
        if (!authToken) throw new Error('Not authenticated');
        const response = await axios.get(`${BASE_URL}/employees`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching employees:', error.message);
        throw new Error('Failed to fetch employees');
    }
});

ipcMain.handle('add-employee', async (event, { token, ...employeeData }) => {
    try {
        const response = await axios.post(`${BASE_URL}/employees`, employeeData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error adding employee:', error.message);
        throw new Error('Failed to add employee');
    }
});

ipcMain.handle('view-employee-details', async (event, { token, id }) => {
    try {
        const response = await axios.get(`${BASE_URL}/employees/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching employee details:', error.message);
        throw new Error('Failed to fetch employee details');
    }
});

ipcMain.handle('delete-employee', async (event, { token, id }) => {
    try {
        await axios.delete(`${BASE_URL}/employees/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
        console.error('Error deleting employee:', error.message);
        throw new Error('Failed to delete employee');
    }
});
