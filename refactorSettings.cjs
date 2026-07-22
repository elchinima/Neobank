const fs = require('fs');
let code = fs.readFileSync('src/components/UserPages/settings/Settings.jsx', 'utf8');

// 1. Add import
if (!code.includes('MorphModal')) {
  code = code.replace("import { useLanguage } from '../../../app/context/LanguageContext'", 
    "import { useLanguage } from '../../../app/context/LanguageContext'\nimport MorphModal from '../common/MorphModal/MorphModal'");
}

// 2. Add global click tracker
if (!code.includes('const [modalPos, setModalPos] = useState(null)')) {
  code = code.replace("const [showVerifyModal, setShowVerifyModal] = useState(false)", 
    "const [showVerifyModal, setShowVerifyModal] = useState(false)\n  const [modalPos, setModalPos] = useState(null)\n\n  useEffect(() => {\n    const handleAnyClick = (e) => setModalPos({ x: e.clientX, y: e.clientY })\n    window.addEventListener('mousedown', handleAnyClick, true)\n    return () => window.removeEventListener('mousedown', handleAnyClick, true)\n  }, [])");
}

// 3. Replace password modal
// {isPasswordModalOpen && (
//   <div className="settings-modal-overlay">
//     <div className="settings-modal">
const passModalRegex = /\{isPasswordModalOpen && \(\s*<div className="settings-modal-overlay">\s*<div className="settings-modal">\s*([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/gm;

code = code.replace(passModalRegex, (match, inner) => {
  return `<MorphModal
        isOpen={isPasswordModalOpen}
        onClose={closePasswordModal}
        clickPos={modalPos}
        overlayClass="settings-modal-overlay"
        modalClass="settings-modal"
      >
        ${inner}
      </MorphModal>`;
});

// 4. Pass clickPos to EmailVerifyModal
const verifyModalRegex = /<EmailVerifyModal\s+isOpen=\{showVerifyModal\}\s+purpose="email"\s+userId=\{user\?\.id\}\s+email=\{user\?\.email\}\s+onSuccess=\{handleVerifySuccess\}\s+onResend=\{handleVerifyResend\}\s+onClose=\{\(\) => setShowVerifyModal\(false\)\}\s*\/>/gm;

code = code.replace(verifyModalRegex, `<EmailVerifyModal
        isOpen={showVerifyModal}
        purpose="email"
        userId={user?.id}
        email={user?.email}
        onSuccess={handleVerifySuccess}
        onResend={handleVerifyResend}
        onClose={() => setShowVerifyModal(false)}
        clickPos={modalPos}
      />`);

fs.writeFileSync('src/components/UserPages/settings/Settings.jsx', code);
console.log("Settings.jsx refactored successfully!");
