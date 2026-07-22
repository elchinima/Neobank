const fs = require('fs');
let code = fs.readFileSync('src/components/UserPages/cards/Cards.jsx', 'utf8');

// 1. Add import
if (!code.includes('MorphModal')) {
  code = code.replace("import { useLanguage } from '../../../app/context/LanguageContext'", 
    "import { useLanguage } from '../../../app/context/LanguageContext'\nimport MorphModal from '../common/MorphModal/MorphModal'");
}

// 2. Add modalPos state
if (!code.includes('const [modalPos, setModalPos] = useState(null)')) {
  code = code.replace("const [creditLimitError, setCreditLimitError] = useState(null)", 
    "const [creditLimitError, setCreditLimitError] = useState(null)\n  const [modalPos, setModalPos] = useState(null)");
}

// 3. Replace all card modals
const regex = /\{([a-zA-Z0-9_]+)\s*&&\s*\(\s*<div className="card-modal-overlay"[^>]*onClick=\{([^}]+)\}\s*>\s*<div className="card-modal" onClick=\{e => e\.stopPropagation\(\)\}>\s*([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/gm;

code = code.replace(regex, (match, condition, onClick) => {
  return `<MorphModal
        isOpen={!!${condition}}
        onClose={${onClick}}
        clickPos={modalPos}
        overlayClass="card-modal-overlay"
        modalClass="card-modal"
      >
        ${match.match(/<div className="card-modal" onClick=\{e => e\.stopPropagation\(\)\}>\s*([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/)[1]}
      </MorphModal>`;
});

// 4. Replace AccountDetailsModal
const regexAccount = /\{showAccountDetailsModal && selectedSettingsCard && \(\s*<div className="card-modal-overlay"[^>]*onClick=\{([^}]+)\}\s*>\s*<div className="card-modal" onClick=\{e => e\.stopPropagation\(\)\}>\s*([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/gm;

code = code.replace(regexAccount, (match, onClick) => {
  return `<MorphModal
        isOpen={!!showAccountDetailsModal && !!selectedSettingsCard}
        onClose={${onClick}}
        clickPos={modalPos}
        overlayClass="card-modal-overlay"
        modalClass="card-modal"
      >
        ${match.match(/<div className="card-modal" onClick=\{e => e\.stopPropagation\(\)\}>\s*([\s\S]*?)<\/div>\s*<\/div>\s*\)\}/)[1]}
      </MorphModal>`;
});

fs.writeFileSync('src/components/UserPages/cards/Cards.jsx', code);
console.log("Refactoring complete!");
