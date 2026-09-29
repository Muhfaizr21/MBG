import os

file_path = "src/components/dashboard/ValidatorPanel.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Emojis to replace with Lucide icons
replacements = [
    ("<span>⚠️</span>", '<AlertTriangle className="h-4 w-4" />'),
    ("<span>✓</span>", '<CheckCircle2 className="h-4 w-4" />'),
    ("✓ Sedang", '<CheckCircle2 className="inline h-3 w-3 mr-1" /> Sedang'),
    (">✕<", '><X className="h-3 w-3" /><'),
    ("<span>🛡️</span>", '<ShieldCheck className="h-4 w-4" />'),
    ("<span>⏳</span>", '<Clock className="h-4 w-4" />'),
    ("🔒 {v.device}", '<Lock className="inline h-3 w-3 mr-1" /> {v.device}'),
    ("<span>✕</span>", '<X className="h-4 w-4" />'),
    ("<span>🔒</span>", '<Lock className="h-4 w-4" />'),
    ("<span>👥</span>", '<Users className="h-4 w-4" />'),
    ("<span>🚨</span>", '<AlertOctagon className="h-4 w-4" />'),
    ("📱 {selectedValidator.device}", '<Smartphone className="inline h-4 w-4 mr-1 text-slate-400" /> {selectedValidator.device}')
]

for old, new in replacements:
    content = content.replace(old, new)

# Add imports
if "lucide-react" not in content:
    import_statement = "import { AlertTriangle, CheckCircle2, X, ShieldCheck, Clock, Lock, Users, AlertOctagon, Smartphone } from 'lucide-react'\n"
    content = content.replace("import { useState, useMemo, useEffect, useRef } from 'react'", "import { useState, useMemo, useEffect, useRef } from 'react'\n" + import_statement)

with open(file_path, "w") as f:
    f.write(content)

print("Icons replaced.")
