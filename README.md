# QuBridge 本机运行

在 Windows PowerShell 中，从项目目录运行：

```powershell
.\setup-web.ps1
& .\.web-venv\Scripts\python.exe app.py
```

若自动检测不到 Python，可用 `-PythonPath` 指定 Python 3.10–3.12 的 `python.exe`。当前机器的旧 `.venv` 指向另一位用户的安装路径，请使用新建的 `.web-venv`。项目默认在 `http://127.0.0.1:5000` 启动。

`requirements-web.txt` 只安装当前 Web 应用及其量子分析模块直接需要的依赖。路由页面接收 OpenQASM 2 `.qasm` 文件，服务端解析量子门；页面上的保真度是按演示拓扑和固定误差模型计算的估计值，并非真实设备校准或测量数据。

验证命令：

```powershell
& .\.web-venv\Scripts\python.exe -m unittest discover -s tests -v
```
