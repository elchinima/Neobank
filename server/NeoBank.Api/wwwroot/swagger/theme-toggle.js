window.addEventListener("load", function() {
    // Ждём, пока Swagger UI отрендерит Topbar
    setTimeout(() => {
        const topbar = document.querySelector(".swagger-ui .topbar-wrapper");
        if(topbar) {
            const btn = document.createElement("button");
            btn.innerText = "🌙 Dark Mode";
            btn.style.marginLeft = "auto";
            btn.style.padding = "5px 10px";
            btn.style.cursor = "pointer";
            btn.style.background = "#333";
            btn.style.color = "#fff";
            btn.style.border = "none";
            btn.style.borderRadius = "4px";

            let isDark = localStorage.getItem("swagger-dark-theme") === "true";
            
            const styleElement = document.createElement("style");
            // Базовые стили для темной темы
            styleElement.innerHTML = `
                body.dark-mode { background: #1b1b1b; color: #fff; }
                .dark-mode .swagger-ui .scheme-container { background: #222; box-shadow: none; border-bottom: 1px solid #444; }
                .dark-mode .swagger-ui .opblock .opblock-summary-operation-id, 
                .dark-mode .swagger-ui .opblock .opblock-summary-path, 
                .dark-mode .swagger-ui .opblock .opblock-summary-path__deprecated,
                .dark-mode .swagger-ui .info .title,
                .dark-mode .swagger-ui .info p,
                .dark-mode .swagger-ui .info a,
                .dark-mode .swagger-ui .model-title,
                .dark-mode .swagger-ui .model,
                .dark-mode .swagger-ui .parameter__name,
                .dark-mode .swagger-ui .parameter__type,
                .dark-mode .swagger-ui .tab li,
                .dark-mode .swagger-ui .response-col_status,
                .dark-mode .swagger-ui .response-col_description,
                .dark-mode .swagger-ui .opblock-description-wrapper p { color: #ddd !important; }
                .dark-mode .swagger-ui .opblock { border-color: #444; }
                .dark-mode .swagger-ui .opblock .opblock-section-header { background: #333; }
                .dark-mode .swagger-ui textarea, .dark-mode .swagger-ui input, .dark-mode .swagger-ui select { background: #333; color: #fff; border: 1px solid #555; }
                .dark-mode .swagger-ui .dialog-ux .modal-ux { background: #222; color: #fff; }
                .dark-mode .swagger-ui .dialog-ux .modal-ux-header h3 { color: #fff; }
                .dark-mode .swagger-ui .dialog-ux .modal-ux-content h4 { color: #ccc; }
                .dark-mode .swagger-ui table thead tr td, .dark-mode .swagger-ui table thead tr th { color: #bbb; }
                .dark-mode .swagger-ui .models .model-container { background: #222; }
                .dark-mode .swagger-ui .models { border: 1px solid #444; }
                .dark-mode .swagger-ui .model-box { background: #333; }
                .dark-mode .swagger-ui .responses-inner h4, .dark-mode .swagger-ui .responses-inner h5 { color: #fff; }
                .dark-mode .swagger-ui .topbar { background: #111; }
                .dark-mode .swagger-ui section.models h4 { color: #fff; }
            `;
            document.head.appendChild(styleElement);

            const toggleTheme = () => {
                if(isDark) {
                    document.body.classList.add("dark-mode");
                    btn.innerText = "☀️ Light Mode";
                    btn.style.background = "#f0f0f0";
                    btn.style.color = "#333";
                } else {
                    document.body.classList.remove("dark-mode");
                    btn.innerText = "🌙 Dark Mode";
                    btn.style.background = "#333";
                    btn.style.color = "#fff";
                }
            };

            toggleTheme();

            btn.onclick = function() {
                isDark = !isDark;
                localStorage.setItem("swagger-dark-theme", isDark);
                toggleTheme();
            };

            // Добавляем кнопку в topbar
            topbar.appendChild(btn);
        }
    }, 1000);
});
