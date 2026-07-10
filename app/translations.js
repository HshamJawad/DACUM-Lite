// ============================================================
// translations.js — Bilingual Dictionary (EN / AR)
// DACUM Lite v3.1  |  i18n Phase 1
//
// Usage:  import { translations } from './translations.js';
// Engine: see i18n.js  →  t(key, { token: value })
//
// Conventions:
//   • {{token}}  placeholders are replaced at runtime by t()
//   • Keys use dot-notation:  module.section.name
//   • data-i18n-html="true"  for keys that contain HTML tags
//   • PDF/Word keys are used inside export functions, NOT in DOM
// ============================================================

export const translations = {

    // ══════════════════════════════════════════════════════════
    //  ENGLISH
    // ══════════════════════════════════════════════════════════
    en: {

        // ── Language toggle ───────────────────────────────────
        'lang.switchTo': 'FR',

        // ── Sidebar — brand ───────────────────────────────────
        'sidebar.brandTagline': 'Chart Generator',

        // ── Sidebar — navigation ──────────────────────────────
        'sidebar.navLabel':           'NAVIGATION',
        'sidebar.nav.chartInfo':      'Chart Info',
        'sidebar.nav.dutiesTasks':    'Duties & Tasks',
        'sidebar.nav.additionalInfo': 'Additional Info',
        'sidebar.nav.help':           'Help',

        // ── Sidebar — projects section ────────────────────────
        'sidebar.projectsLabel':      '📁 PROJECTS',
        'sidebar.newBtn':             '+ New',
        'sidebar.searchPlaceholder':  '🔍  Search projects…',
        'sidebar.installApp':         'Install App',
        'sidebar.noProjects':         'No projects found',

        // ── Sidebar — project counts (interpolated) ───────────
        'sidebar.projectCount.one':   '1 project',
        'sidebar.projectCount.other': '{{n}} projects',
        'sidebar.dutyCount.one':      '1 duty',
        'sidebar.dutyCount.other':    '{{n}} duties',

        // ── Relative time (used in sidebar project cards) ─────
        'time.justNow':     'just now',
        'time.minutesAgo':  '{{n}}m ago',
        'time.hoursAgo':    '{{n}}h ago',
        'time.daysAgo':     '{{n}}d ago',

        // ── Project actions ───────────────────────────────────
        'project.renameTip':          'Rename project',
        'project.deleteTip':          'Delete project',
        'project.untitled':           'Untitled Project',
        'project.prompt.new':         'Project name:',
        'project.prompt.newDefault':  'New Project',
        'project.prompt.rename':      'Rename project:',
        'project.alert.cannotDelete': 'Cannot delete the only project.',
        'project.confirm.delete':     'Delete "{{name}}"?\nThis cannot be undone.',

        // ── Status — project operations ───────────────────────
        'status.projectImported': 'Project "{{name}}" imported ✓',
        'status.projectCreated':  'Created "{{name}}" ✓',
        'status.projectSwitched': 'Switched to "{{name}}" ✓',
        'status.projectDeleted':  'Project deleted. Switched to "{{name}}"',

        // ── Top Toolbar ───────────────────────────────────────
        'toolbar.snapshot':      'Snapshot',
        'toolbar.exportProject': 'Export Project',
        'toolbar.export':        'Export',
        'toolbar.importProject': 'Import Project',
        'toolbar.import':        'Import',
        'toolbar.pdf':           'PDF',
        'toolbar.word':          'Word',
        'toolbar.clearAll':      'Clear All',
        'toolbar.clear':         'Clear',
        'toolbar.undo':          'Undo',
        'toolbar.redo':          'Redo',

        // ── Tab 1 — Chart Info ────────────────────────────────
        'chartInfo.heading':             'DACUM Research Chart Information',
        'chartInfo.dacumDate':           '📅 DACUM Date:',
        'chartInfo.producedFor':         '🏢 Produced For:',
        'chartInfo.producedFor.ph':      'e.g., Company/Organization Name',
        'chartInfo.producedBy':          '🎓 Produced By:',
        'chartInfo.producedBy.ph':       'e.g., Training Institution Name',
        'chartInfo.sector':              '🏭 Sector:',
        'chartInfo.sector.ph':           'e.g., Industrial',
        'chartInfo.occupationTitle':     '💼 Occupation Title:',
        'chartInfo.occupationTitle.ph':  'e.g., Automotive Technician',
        'chartInfo.jobTitle':            '👔 Job Title:',
        'chartInfo.jobTitle.ph':         'e.g., Service Technician Level 2',
        'chartInfo.noImage':             'No image',
        'chartInfo.addLogo':             '🖼️ Add Logo',
        'chartInfo.remove':              '🗑️ Remove',
        'chartInfo.scopeLabel':          '📋 Scope of Work / Occupational Definition:',
        'chartInfo.scopeHint':           'A concise paragraph describing what the occupation covers and where its boundaries lie. Used in exports and referenced for duty/task generation.',
        'chartInfo.scopePlaceholder':    'Defines the key responsibilities and boundaries of this occupation within its work context. Includes typical tasks, tools, and work environments, and excludes roles or functions that fall under other occupations or specializations.',
        'chartInfo.workshopPanel':       '👥 Workshop Panel',
        'chartInfo.facilitators':        '👥 Facilitators:',
        'chartInfo.facilitators.ph':     'Enter facilitator names (one per line)',
        'chartInfo.observers':           '👁️ Observers:',
        'chartInfo.observers.ph':        'Enter observer names (one per line)',
        'chartInfo.panelMembers':        '🎯 Panel Members:',
        'chartInfo.panelMembers.ph':     'Enter panel member names (one per line)',

        // ── Tab 2 — Duties & Tasks ────────────────────────────
        'duties.heading':       'Duties and Tasks',
        'duties.addDuty':       '➕ Add Duty',
        'duties.cardHeading':   '🃏 Card View — Duties & Tasks',
        'duties.viewTable':     '📋 Table',
        'duties.viewCard':      '🃏 Card',
        'duties.viewWall':      '🧱 Wall',

        // ── Tab 3 — Additional Info ───────────────────────────
        'additionalInfo.heading': 'Additional Information',
        'additionalInfo.intro':   '📝 Enter information for each section. Click the rename button to customize section headings.',
        'additionalInfo.rename':  '✏️ Rename',
        'additionalInfo.clear':   '🗑️ Clear',
        'additionalInfo.addSection': '➕ Add Section',
        'section.removeBtn':         '❌ Remove',

        // Default section headings
        // IMPORTANT: These values must match the defaults used in clearAll()
        // and clearSection() — the JS modules read them via t() at runtime.
        'section.knowledge': 'Knowledge Requirements',
        'section.skills':    'Skills Requirements',
        'section.behaviors': 'Worker Behaviors/Traits',
        'section.tools':     'Tools, Equipment, Supplies and Materials',
        'section.trends':    'Future Trends and Concerns',
        'section.acronyms':  'Acronyms',
        'section.careerPath':'Career Path',
        'section.custom':    'Custom Section {{n}}',

        // Additional Info — textarea placeholders
        'section.knowledge.ph':
            'Enter each knowledge requirement on a new line\nExample:\n• Understanding of electrical systems\n• Knowledge of safety protocols\n• Familiarity with diagnostic tools',
        'section.skills.ph':
            'Enter each skill requirement on a new line\nExample:\n• Ability to read technical diagrams\n• Proficiency in using hand tools\n• Strong problem-solving skills',
        'section.behaviors.ph':
            'Enter each behavior or trait on a new line\nExample:\n• Attention to detail\n• Good communication skills\n• Team player\n• Safety conscious',
        'section.tools.ph':
            'Enter each tool/equipment on a new line\nExample:\n• Digital multimeter\n• Pneumatic impact wrench\n• Safety glasses\n• Hydraulic lift',
        'section.trends.ph':
            'Enter each trend/concern on a new line\nExample:\n• Increased use of electric vehicles\n• Advanced driver assistance systems\n• Sustainability requirements\n• Automation in manufacturing',
        'section.acronyms.ph':
            'Enter acronyms and their definitions on separate lines\nExample:\n• OBD - On-Board Diagnostics\n• ECU - Engine Control Unit\n• TPMS - Tire Pressure Monitoring System\n• ABS - Anti-lock Braking System',
        'section.careerPath.ph':
            'Enter career progression information on separate lines\nExample:\n• Entry Level: Technician Apprentice\n• Mid Level: Certified Technician\n• Advanced: Senior Technician / Specialist\n• Management: Shop Foreman / Service Manager',
        'section.custom.ph':
            'Enter information for this custom section on separate lines',

        // ── Snapshot Panel ────────────────────────────────────
        'snapshot.panelTitle':       '📸 Saved Snapshots',
        'snapshot.empty':            'No snapshots yet. Click 📸 to save one.',
        'snapshot.restore':          'Restore',
        'snapshot.dutyCount.one':    '1 duty',
        'snapshot.dutyCount.other':  '{{n}} duties',
        'snapshot.prompt':           'Name this snapshot (leave blank for auto-name):',
        'snapshot.autoName':         'Snapshot {{n}}',

        // ── Status — snapshots ────────────────────────────────
        'status.snapshotSaved':    'Snapshot saved: "{{label}}" ✓',
        'status.snapshotRestored': 'Snapshot restored: "{{label}}" ✓',

        // ── Status — undo / redo ──────────────────────────────
        'status.undone': '↩ Undone: {{type}}',
        'status.redone': '↪ Redone: {{type}}',

        // ── Confirm / Alert dialogs ───────────────────────────
        'confirm.clearDuty':    'Are you sure you want to clear this duty and all its tasks?',
        'confirm.clearAll':     'Are you sure you want to clear ALL data? This cannot be undone!',
        'confirm.removeImage':  'Are you sure you want to remove this logo?',
        'confirm.clearSection': 'Are you sure you want to clear this section?',
        'confirm.removeSection':'Are you sure you want to remove this section? This cannot be undone!',
        'confirm.removeDuty':   'Remove this duty and all its tasks?',
        'confirm.wallDelDuty':  'Delete "{{title}}" and all its tasks?',

        // ── Status — duties & tasks ───────────────────────────
        'status.dutyCleared':        'Duty cleared! ✓',
        'status.allCleared':         'All data cleared! ✓',
        'status.headingUpdated':     'Heading updated! ✓',
        'status.sectionCleared':     'Section cleared! ✓',
        'status.customSectionAdded': 'Custom section added! ✓',
        'status.sectionRemoved':     'Section removed! ✓',

        // ── Status — images ───────────────────────────────────
        'status.imageBadType':   'Please upload a valid image file (JPG, JPEG, PNG, or BMP)',
        'status.imageUploaded':  'Image uploaded successfully! ✓',
        'status.imageRemoved':   'Image removed! ✓',

        // ── Status — save / load ──────────────────────────────
        'status.dataSaved':      'Data saved successfully! ✓',
        'status.dataSaveError':  'Error saving data: {{msg}}',
        'status.dataLoaded':     'Data loaded successfully! ✓',
        'status.jsonParseError': 'Error: Invalid JSON file',
        'status.fileLoadError':  'Error loading file: {{msg}}',

        // ── Status — export ───────────────────────────────────
        'status.wordLibMissing':  'Error: Word export library not loaded. Please refresh the page.',
        'status.wordGenerating':  'Generating Word document...',
        'status.wordExported':    'Word document exported successfully! ✓',
        'status.wordExportError': 'Error generating Word document: {{msg}}',
        'status.pdfMissingFields':'Please fill in at least the Occupation Title and Job Title',
        'status.pdfGenerating':       'Generating PDF, please wait…',
        'status.html2canvasMissing':  'html2canvas library not loaded. Check your internet connection.',
        'status.pdfNoDuties':     'Please add at least one duty with tasks',
        'status.pdfExported':     'PDF exported successfully! ✓',
        'status.pdfExportError':  'Error generating PDF: {{msg}}',

        // ── Renderer — table view ─────────────────────────────
        'renderer.dutyLabel':        'Duty {{letter}}',
        'renderer.dragDuty':         'Drag to reorder duties',
        'renderer.dragTask':         'Drag to reorder or move to another duty',
        'renderer.clearDutyBtn':     '🗑️ Clear',
        'renderer.removeDutyBtn':    '🗑️ Remove Duty',
        'renderer.addTaskBtn':       '➕ Add Task',
        'renderer.dutyPlaceholder':  'Enter duty description',
        'renderer.taskPlaceholder':  'Enter task description',

        // ── Renderer — card view ──────────────────────────────
        'renderer.noDuties':            'No duties added yet.',
        'renderer.noTasks':             'No tasks yet.',
        'renderer.removeDutyTitle':     'Remove duty',
        'renderer.removeTaskTitle':     'Remove task',
        'renderer.dragTaskCard':        'Drag to reorder or move task',
        'renderer.addTaskCard':         '➕ Task',
        'renderer.addTaskCardTitle':    'Add task to this duty',
        'renderer.dutyPlaceholderCard': 'Enter duty',
        'renderer.taskPlaceholderCard': 'Enter task',

        // ── Renderer — wall view ──────────────────────────────
        'renderer.wallNoDuties':        'No duties added yet. Go to the Duties & Tasks tab to add duties.',
        'renderer.wallNoTasks':         'No tasks yet — drop here or use ＋',
        'renderer.wallDutyBadge':       'Duty {{letter}}',
        'renderer.wallTaskLabel':       'Task {{letter}}{{n}}',
        'renderer.wallDragDuty':        'Drag to reorder duties',
        'renderer.wallDragTask':        'Drag to reorder or move to another duty',
        'renderer.wallAddDutyTitle':    'Add new duty below',
        'renderer.wallDelDutyTitle':    'Delete this duty',
        'renderer.wallDelDutyConfirm':  'Delete "{{title}}" and all its tasks?',
        'renderer.wallAddTaskTitle':    'Add new task after this one',
        'renderer.wallDelTaskTitle':    'Delete this task',
        'renderer.wallDutyPlaceholder': 'Enter duty…',
        'renderer.wallTaskPlaceholder': 'Enter task…',

        // ── InfoBox (toggleInfoBox) ───────────────────────────
        'infobox.hide': 'Hide',
        'infobox.show': 'Show',

        // ── Wall View overlay controls ────────────────────────
        'wall.exit':           '✕ Exit',
        'wall.reset':          '↺ Reset',
        'wall.print':          '🖨️ Print',
        'wall.full':           '⛶ Full',
        'wall.title':          '🧱 Wall View',
        'wall.fullscreen':     '⛶ Fullscreen',
        'wall.exitFullscreen': '⛶ Exit Fullscreen',

        // ── Wall View — view tabs ─────────────────────────────
        'wall.tabCard':  '🃏 Card',
        'wall.tabTable': '📋 Table',
        'wall.tabWall':  '🧱 Wall',

        // ── File Engine ───────────────────────────────────────
        'fileEngine.exportFailed':       'Export failed:\n\n{{msg}}',
        'fileEngine.readFailed':         'Could not read the selected file.\nPlease check the file and try again.',
        'fileEngine.importInvalidJson':  'The selected file is not valid JSON.\nIt may be corrupted or in the wrong format.',
        'fileEngine.importFailed':       'Import failed — this is not a valid DACUM project file.\n\nReason: {{reason}}',
        'fileEngine.importError':        'Import failed:\n\n{{msg}}',
        'fileEngine.importedSuffix':     ' (Imported)',

        // ── PDF export — embedded text strings ───────────────
        // NOTE: Arabic font support in jsPDF requires a third-party Arabic
        // font plugin (e.g. jsPDF-CustomFonts-support or arabic-pdf-plugin).
        // Until integrated, Arabic text in exported PDFs will not render
        // correctly. The UI language switch does NOT affect export quality.
        'pdf.chartTitle':        'DACUM Research Chart for {{title}}',
        'pdf.producedFor':       'Produced for',
        'pdf.producedBy':        'Produced by',
        'pdf.sector':            'Sector:',
        'pdf.occupationTitle':   'Occupation Title:',
        'pdf.jobTitle':          'Job Title:',
        'pdf.dutiesAndTasks':    'DUTIES AND TASKS',
        'pdf.dutiesAndTasksCont':'DUTIES AND TASKS (continued)',
        'pdf.generalKnowledge':  'General Knowledge and Skills',
        'pdf.dutyLabel':         'DUTY {{letter}}: {{title}}',
        'pdf.taskLabel':         'Task {{letter}}{{n}}:',

        // ── Word export — embedded text strings ───────────────
        // NOTE: Arabic RTL support in docx requires the `bidirectional: true`
        // option on Paragraph/TextRun objects (already scaffolded in exports).
        // Full Arabic rendering also needs an Arabic-capable font embedded in
        // the document — this requires post-processing (future enhancement).
        'word.occupationTitle': 'Occupation Title: {{title}}',
        'word.jobTitle':        'Job Title: {{title}}',
        'word.sector':          'Sector: {{name}}',
        'word.dacumDate':       'DACUM Date: {{date}}',
        'word.producedFor':     'Produced For: {{name}}',
        'word.producedBy':      'Produced By: {{name}}',
        'word.dutiesAndTasks':  'Duties and Tasks',
        'word.additionalInfo':  'Additional Information',
        'word.dutyLabel':       'DUTY {{letter}}: {{title}}',
        'word.taskLabel':       'Task {{letter}}{{n}}: {{text}}',

        // ── Copyright ─────────────────────────────────────────
        'copyright.main':
            '© 2026 DACUM Lite | by Husham Jawad Kadhim | Version 3.1.0 | All Rights Reserved',
        'copyright.disclaimer':
            'This tool is provided "as is" without warranty of any kind. The developer assumes no ' +
            'responsibility for any inaccuracies, errors, omissions, or inconsistencies in the ' +
            'generated documents. Users are solely responsible for verifying and validating all ' +
            'content before use.',

        // ── Help Center ───────────────────────────────────────
        'help.heroTitle':       'Help Center',
        'help.heroSub':         'Everything you need to use DACUM Lite effectively',
        'help.quickStartTitle': 'Quick Start: How to Use DACUM Lite',

        // Steps — use data-i18n-html="true" in DOM (contain <strong>/<em>)
        'help.step1':  'Enter the <strong>Sector</strong>, <strong>Occupation Title</strong> and <strong>Job Title</strong> in the <em>Chart Info</em> tab.',
        'help.step2':  'Add a <strong>Scope of Work</strong> to define the occupational boundary.',
        'help.step3':  'Go to <em>Duties &amp; Tasks</em> — each new duty starts with one task automatically.',
        'help.step4':  'Use <strong>➕ Add Task</strong> inside each duty. Duties are labelled <strong>A, B, C…</strong> and tasks <strong>A1, A2, B1…</strong> automatically.',
        'help.step5':  '<strong>Drag &amp; drop</strong> any task or duty to reorder — labels update instantly.',
        'help.step6':  'Switch to <strong>🃏 Card View</strong> or <strong>🧱 Wall View</strong> for different display modes.',
        'help.step7':  'Fill in <em>Additional Info</em> (Knowledge, Skills, Tools, Trends…) as needed.',
        'help.step8':  'Fill in <strong>Workshop Panel</strong> (Facilitators, Observers, Panel Members) in Chart Info.',
        'help.step9':  '<strong>Export</strong> as PDF or Word document from the top toolbar.',
        'help.step10': 'Use <strong>📸 Snapshots</strong> to save named versions before major edits.',

        // Tips
        'help.tipUndoTitle':     'Undo / Redo',
        'help.tipUndoText':      'Every action is reversible. Use Ctrl+Z / Ctrl+Y or the toolbar buttons.',
        'help.tipAutoSaveTitle': 'Auto-save',
        'help.tipAutoSaveText':  'Your work is saved automatically to the browser. Use Projects to manage multiple charts.',
        'help.tipWallTitle':     'Wall View',
        'help.tipWallText':      'Edit, reorder, add and delete duties &amp; tasks directly on the wall — no need to switch views.',
        'help.tipPrintTitle':    'Print Wall',
        'help.tipPrintText':     'Use the Print button inside Wall View for A3 landscape output — ideal for workshop projection.',

        // User Guide card
        'help.userGuideTitle':   'User Guide',
        'help.userGuideDesc':    'Access the full documentation for DACUM Lite — includes detailed instructions, screenshots, and best practices.',
        'help.openUserGuide':    '📘 Open User Guide',
        'help.viewNewTab':       '🔗 View in New Tab',
        'help.qrCaption':        'Scan to open the User Guide on your mobile device',

        // About card
        'help.aboutTitle':       'About the Creator',
        'help.creatorRole':      'Creator of DACUM Lite',
        'help.creatorBio':       'TVET Curriculum Developer &amp; Educational Technology Innovator',
        'help.emailLabel':       'EMAIL',
        'help.linkedinLabel':    'LINKEDIN',
        'help.getInTouchTitle':  'Get in Touch',
        'help.getInTouchText':   'For questions, feedback, suggestions, or collaboration opportunities, please reach out using the contact information above.',

        // Disclaimer — shown only in Help tab
        'help.disclaimerTitle':  'Disclaimer',
        'help.disclaimerText':   'This tool is provided "as is" without warranty of any kind. The developer assumes no responsibility for any inaccuracies, errors, omissions, or inconsistencies in the generated documents. Users are solely responsible for verifying and validating all content before use.',
    },

    // ══════════════════════════════════════════════════════════
    //  FRENCH
    // ══════════════════════════════════════════════════════════
    fr: {

        // ── Language toggle ───────────────────────────────────
        'lang.switchTo': 'AR',

        // ── Sidebar — brand ───────────────────────────────────
        'sidebar.brandTagline': 'Générateur de graphiques',

        // ── Sidebar — navigation ──────────────────────────────
        'sidebar.navLabel':           'NAVIGATION',
        'sidebar.nav.chartInfo':      'Infos du graphique',
        'sidebar.nav.dutiesTasks':    'Fonctions et tâches',
        'sidebar.nav.additionalInfo': 'Infos complémentaires',
        'sidebar.nav.help':           'Aide',

        // ── Sidebar — projects section ────────────────────────
        'sidebar.projectsLabel':      '📁 PROJETS',
        'sidebar.newBtn':             '+ Nouveau',
        'sidebar.searchPlaceholder':  '🔍  Rechercher des projets…',
        'sidebar.installApp':         "Installer l'application",
        'sidebar.noProjects':         'Aucun projet trouvé',

        // ── Sidebar — project counts (interpolated) ───────────
        'sidebar.projectCount.one':   '1 projet',
        'sidebar.projectCount.other': '{{n}} projets',
        'sidebar.dutyCount.one':      '1 fonction',
        'sidebar.dutyCount.other':    '{{n}} fonctions',

        // ── Relative time (used in sidebar project cards) ─────
        'time.justNow':     "à l'instant",
        'time.minutesAgo':  'il y a {{n}} min',
        'time.hoursAgo':    'il y a {{n}} h',
        'time.daysAgo':     'il y a {{n}} j',

        // ── Project actions ───────────────────────────────────
        'project.renameTip':          'Renommer le projet',
        'project.deleteTip':          'Supprimer le projet',
        'project.untitled':           'Projet sans titre',
        'project.prompt.new':         'Nom du projet :',
        'project.prompt.newDefault':  'Nouveau projet',
        'project.prompt.rename':      'Renommer le projet :',
        'project.alert.cannotDelete': "Impossible de supprimer le seul projet existant.",
        'project.confirm.delete':     'Supprimer « {{name}} » ?\nCette action est irréversible.',

        // ── Status — project operations ───────────────────────
        'status.projectImported': 'Projet « {{name}} » importé ✓',
        'status.projectCreated':  '« {{name}} » créé ✓',
        'status.projectSwitched': 'Basculé vers « {{name}} » ✓',
        'status.projectDeleted':  'Projet supprimé. Basculé vers « {{name}} »',

        // ── Top Toolbar ───────────────────────────────────────
        'toolbar.snapshot':      'Instantané',
        'toolbar.exportProject': 'Exporter le projet',
        'toolbar.export':        'Exporter',
        'toolbar.importProject': 'Importer un projet',
        'toolbar.import':        'Importer',
        'toolbar.pdf':           'PDF',
        'toolbar.word':          'Word',
        'toolbar.clearAll':      'Tout effacer',
        'toolbar.clear':         'Effacer',
        'toolbar.undo':          'Annuler',
        'toolbar.redo':          'Rétablir',

        // ── Tab 1 — Chart Info ────────────────────────────────
        'chartInfo.heading':             'Informations du graphique DACUM',
        'chartInfo.dacumDate':           '📅 Date DACUM :',
        'chartInfo.producedFor':         '🏢 Préparé pour :',
        'chartInfo.producedFor.ph':      "ex. : nom de l'entreprise / organisation",
        'chartInfo.producedBy':          '🎓 Préparé par :',
        'chartInfo.producedBy.ph':       "ex. : nom de l'établissement de formation",
        'chartInfo.sector':              '🏭 Secteur :',
        'chartInfo.sector.ph':           'ex. : Industriel',
        'chartInfo.occupationTitle':     '💼 Titre de la profession :',
        'chartInfo.occupationTitle.ph':  'ex. : Technicien automobile',
        'chartInfo.jobTitle':            '👔 Titre du poste :',
        'chartInfo.jobTitle.ph':         'ex. : Technicien de service niveau 2',
        'chartInfo.noImage':             'Aucune image',
        'chartInfo.addLogo':             '🖼️ Ajouter un logo',
        'chartInfo.remove':              '🗑️ Supprimer',
        'chartInfo.scopeLabel':          "📋 Champ d'application / Définition de la profession :",
        'chartInfo.scopeHint':           "Un paragraphe concis décrivant ce que couvre la profession et où se situent ses limites. Utilisé dans les exports et pour la génération des fonctions/tâches.",
        'chartInfo.scopePlaceholder':    "Définit les principales responsabilités et les limites de cette profession dans son contexte de travail. Inclut les tâches, outils et environnements de travail typiques, et exclut les rôles ou fonctions relevant d'autres professions ou spécialisations.",
        'chartInfo.workshopPanel':       "👥 Panel de l'atelier",
        'chartInfo.facilitators':        '👥 Animateurs :',
        'chartInfo.facilitators.ph':     "Entrez les noms des animateurs (un par ligne)",
        'chartInfo.observers':           '👁️ Observateurs :',
        'chartInfo.observers.ph':        'Entrez les noms des observateurs (un par ligne)',
        'chartInfo.panelMembers':        '🎯 Membres du panel :',
        'chartInfo.panelMembers.ph':     'Entrez les noms des membres du panel (un par ligne)',

        // ── Tab 2 — Duties & Tasks ────────────────────────────
        'duties.heading':       'Fonctions et tâches',
        'duties.addDuty':       '➕ Ajouter une fonction',
        'duties.cardHeading':   '🃏 Vue en cartes — Fonctions et tâches',
        'duties.viewTable':     '📋 Tableau',
        'duties.viewCard':      '🃏 Cartes',
        'duties.viewWall':      '🧱 Mur',

        // ── Tab 3 — Additional Info ───────────────────────────
        'additionalInfo.heading': 'Informations complémentaires',
        'additionalInfo.intro':   '📝 Renseignez les informations de chaque section. Cliquez sur le bouton renommer pour personnaliser les titres de section.',
        'additionalInfo.rename':  '✏️ Renommer',
        'additionalInfo.clear':   '🗑️ Effacer',
        'additionalInfo.addSection': '➕ Ajouter une section',
        'section.removeBtn':         '❌ Supprimer',

        // Default section headings
        // IMPORTANT: These values must match the defaults used in clearAll()
        // and clearSection() — the JS modules read them via t() at runtime.
        'section.knowledge': 'Connaissances requises',
        'section.skills':    'Habiletés requises',
        'section.behaviors': "Comportements et traits professionnels",
        'section.tools':     'Outils, équipements, fournitures et matériaux',
        'section.trends':    'Tendances et préoccupations futures',
        'section.acronyms':  'Acronymes',
        'section.careerPath':'Cheminement de carrière',
        'section.custom':    'Section personnalisée {{n}}',

        // Additional Info — textarea placeholders
        'section.knowledge.ph':
            'Entrez chaque connaissance requise sur une nouvelle ligne\nExemple :\n• Compréhension des systèmes électriques\n• Connaissance des protocoles de sécurité\n• Familiarité avec les outils de diagnostic',
        'section.skills.ph':
            'Entrez chaque habileté requise sur une nouvelle ligne\nExemple :\n• Capacité à lire des schémas techniques\n• Maîtrise des outils manuels\n• Bonnes capacités de résolution de problèmes',
        'section.behaviors.ph':
            'Entrez chaque comportement ou trait sur une nouvelle ligne\nExemple :\n• Souci du détail\n• Bonnes compétences en communication\n• Esprit d\u2019équipe\n• Sensibilisation à la sécurité',
        'section.tools.ph':
            'Entrez chaque outil/équipement sur une nouvelle ligne\nExemple :\n• Multimètre numérique\n• Clé à chocs pneumatique\n• Lunettes de sécurité\n• Pont élévateur hydraulique',
        'section.trends.ph':
            'Entrez chaque tendance/préoccupation sur une nouvelle ligne\nExemple :\n• Usage accru des véhicules électriques\n• Systèmes avancés d\u2019aide à la conduite\n• Exigences de durabilité\n• Automatisation de la fabrication',
        'section.acronyms.ph':
            'Entrez les acronymes et leurs définitions sur des lignes séparées\nExemple :\n• OBD - Diagnostic embarqué\n• ECU - Unité de commande moteur\n• TPMS - Système de surveillance de la pression des pneus\n• ABS - Système antiblocage des roues',
        'section.careerPath.ph':
            'Entrez les informations de progression de carrière sur des lignes séparées\nExemple :\n• Niveau débutant : apprenti technicien\n• Niveau intermédiaire : technicien certifié\n• Niveau avancé : technicien senior / spécialiste\n• Gestion : chef d\u2019atelier / responsable du service',
        'section.custom.ph':
            'Entrez les informations de cette section personnalisée sur des lignes séparées',

        // ── Snapshot Panel ────────────────────────────────────
        'snapshot.panelTitle':       '📸 Instantanés enregistrés',
        'snapshot.empty':            'Aucun instantané pour le moment. Cliquez sur 📸 pour en enregistrer un.',
        'snapshot.restore':          'Restaurer',
        'snapshot.dutyCount.one':    '1 fonction',
        'snapshot.dutyCount.other':  '{{n}} fonctions',
        'snapshot.prompt':           'Nommez cet instantané (laissez vide pour un nom automatique) :',
        'snapshot.autoName':         'Instantané {{n}}',

        // ── Status — snapshots ────────────────────────────────
        'status.snapshotSaved':    'Instantané enregistré : « {{label}} » ✓',
        'status.snapshotRestored': 'Instantané restauré : « {{label}} » ✓',

        // ── Status — undo / redo ──────────────────────────────
        'status.undone': '↩ Annulé : {{type}}',
        'status.redone': '↪ Rétabli : {{type}}',

        // ── Confirm / Alert dialogs ───────────────────────────
        'confirm.clearDuty':    'Voulez-vous vraiment effacer cette fonction et toutes ses tâches ?',
        'confirm.clearAll':     'Voulez-vous vraiment effacer TOUTES les données ? Cette action est irréversible !',
        'confirm.removeImage':  'Voulez-vous vraiment supprimer ce logo ?',
        'confirm.clearSection': 'Voulez-vous vraiment effacer cette section ?',
        'confirm.removeSection':'Voulez-vous vraiment supprimer cette section ? Cette action est irréversible !',
        'confirm.removeDuty':   'Supprimer cette fonction et toutes ses tâches ?',
        'confirm.wallDelDuty':  'Supprimer « {{title}} » et toutes ses tâches ?',

        // ── Status — duties & tasks ───────────────────────────
        'status.dutyCleared':        'Fonction effacée ! ✓',
        'status.allCleared':         'Toutes les données ont été effacées ! ✓',
        'status.headingUpdated':     'Titre mis à jour ! ✓',
        'status.sectionCleared':     'Section effacée ! ✓',
        'status.customSectionAdded': 'Section personnalisée ajoutée ! ✓',
        'status.sectionRemoved':     'Section supprimée ! ✓',

        // ── Status — images ───────────────────────────────────
        'status.imageBadType':   'Veuillez importer un fichier image valide (JPG, JPEG, PNG ou BMP)',
        'status.imageUploaded':  'Image importée avec succès ! ✓',
        'status.imageRemoved':   'Image supprimée ! ✓',

        // ── Status — save / load ──────────────────────────────
        'status.dataSaved':      'Données enregistrées avec succès ! ✓',
        'status.dataSaveError':  "Erreur lors de l'enregistrement des données : {{msg}}",
        'status.dataLoaded':     'Données chargées avec succès ! ✓',
        'status.jsonParseError': 'Erreur : fichier JSON invalide',
        'status.fileLoadError':  'Erreur lors du chargement du fichier : {{msg}}',

        // ── Status — export ───────────────────────────────────
        'status.wordLibMissing':  "Erreur : la bibliothèque d'export Word n'est pas chargée. Veuillez actualiser la page.",
        'status.wordGenerating':  'Génération du document Word en cours…',
        'status.wordExported':    'Document Word exporté avec succès ! ✓',
        'status.wordExportError': 'Erreur lors de la génération du document Word : {{msg}}',
        'status.pdfMissingFields':'Veuillez renseigner au moins le titre de la profession et le titre du poste',
        'status.pdfGenerating':       'Génération du PDF, veuillez patienter…',
        'status.html2canvasMissing':  "La bibliothèque html2canvas n'est pas chargée. Vérifiez votre connexion internet.",
        'status.pdfNoDuties':     'Veuillez ajouter au moins une fonction avec des tâches',
        'status.pdfExported':     'PDF exporté avec succès ! ✓',
        'status.pdfExportError':  'Erreur lors de la génération du PDF : {{msg}}',

        // ── Renderer — table view ─────────────────────────────
        'renderer.dutyLabel':        'Fonction {{letter}}',
        'renderer.dragDuty':         'Glisser pour réorganiser les fonctions',
        'renderer.dragTask':         'Glisser pour réorganiser ou déplacer vers une autre fonction',
        'renderer.clearDutyBtn':     '🗑️ Effacer',
        'renderer.removeDutyBtn':    '🗑️ Supprimer la fonction',
        'renderer.addTaskBtn':       '➕ Ajouter une tâche',
        'renderer.dutyPlaceholder':  'Entrez la description de la fonction',
        'renderer.taskPlaceholder':  'Entrez la description de la tâche',

        // ── Renderer — card view ──────────────────────────────
        'renderer.noDuties':            'Aucune fonction ajoutée pour le moment.',
        'renderer.noTasks':             'Aucune tâche pour le moment.',
        'renderer.removeDutyTitle':     'Supprimer la fonction',
        'renderer.removeTaskTitle':     'Supprimer la tâche',
        'renderer.dragTaskCard':        'Glisser pour réorganiser ou déplacer la tâche',
        'renderer.addTaskCard':         '➕ Tâche',
        'renderer.addTaskCardTitle':    'Ajouter une tâche à cette fonction',
        'renderer.dutyPlaceholderCard': 'Entrez la fonction',
        'renderer.taskPlaceholderCard': 'Entrez la tâche',

        // ── Renderer — wall view ──────────────────────────────
        'renderer.wallNoDuties':        "Aucune fonction ajoutée pour le moment. Allez à l'onglet Fonctions et tâches pour en ajouter.",
        'renderer.wallNoTasks':         'Aucune tâche pour le moment — déposez ici ou utilisez ＋',
        'renderer.wallDutyBadge':       'Fonction {{letter}}',
        'renderer.wallTaskLabel':       'Tâche {{letter}}{{n}}',
        'renderer.wallDragDuty':        'Glisser pour réorganiser les fonctions',
        'renderer.wallDragTask':        'Glisser pour réorganiser ou déplacer vers une autre fonction',
        'renderer.wallAddDutyTitle':    'Ajouter une nouvelle fonction ci-dessous',
        'renderer.wallDelDutyTitle':    'Supprimer cette fonction',
        'renderer.wallDelDutyConfirm':  'Supprimer « {{title}} » et toutes ses tâches ?',
        'renderer.wallAddTaskTitle':    'Ajouter une nouvelle tâche après celle-ci',
        'renderer.wallDelTaskTitle':    'Supprimer cette tâche',
        'renderer.wallDutyPlaceholder': 'Entrez la fonction…',
        'renderer.wallTaskPlaceholder': 'Entrez la tâche…',

        // ── InfoBox ───────────────────────────────────────────
        'infobox.hide': 'Masquer',
        'infobox.show': 'Afficher',

        // ── Wall View overlay controls ────────────────────────
        'wall.exit':           '✕ Quitter',
        'wall.reset':          '↺ Réinitialiser',
        'wall.print':          '🖨️ Imprimer',
        'wall.full':           '⛶ Plein',
        'wall.title':          '🧱 Vue murale',
        'wall.fullscreen':     '⛶ Plein écran',
        'wall.exitFullscreen': '⛶ Quitter le plein écran',

        // ── Wall View — view tabs ─────────────────────────────
        'wall.tabCard':  '🃏 Cartes',
        'wall.tabTable': '📋 Tableau',
        'wall.tabWall':  '🧱 Mur',

        // ── File Engine ───────────────────────────────────────
        'fileEngine.exportFailed':      "Échec de l'export :\n\n{{msg}}",
        'fileEngine.readFailed':        "Impossible de lire le fichier sélectionné.\nVeuillez vérifier le fichier et réessayer.",
        'fileEngine.importInvalidJson': "Le fichier sélectionné n'est pas un JSON valide.\nIl est peut-être corrompu ou dans un mauvais format.",
        'fileEngine.importFailed':      "Échec de l'import — ce n'est pas un fichier de projet DACUM valide.\n\nRaison : {{reason}}",
        'fileEngine.importError':       "Échec de l'import :\n\n{{msg}}",
        'fileEngine.importedSuffix':    ' (Importé)',

        // ── PDF export — embedded text strings ───────────────
        // NOTE : le support de la police arabe dans jsPDF nécessite un
        // module tiers dédié. Ce commentaire est conservé tel quel de
        // la version anglaise à titre de documentation technique.
        'pdf.chartTitle':        'Graphique de recherche DACUM pour {{title}}',
        'pdf.producedFor':       'Préparé pour',
        'pdf.producedBy':        'Préparé par',
        'pdf.sector':            'Secteur :',
        'pdf.occupationTitle':   'Titre de la profession :',
        'pdf.jobTitle':          'Titre du poste :',
        'pdf.dutiesAndTasks':    'FONCTIONS ET TÂCHES',
        'pdf.dutiesAndTasksCont':'FONCTIONS ET TÂCHES (suite)',
        'pdf.generalKnowledge':  'Connaissances et habiletés générales',
        'pdf.dutyLabel':         'FONCTION {{letter}} : {{title}}',
        'pdf.taskLabel':         'Tâche {{letter}}{{n}} :',

        // ── Word export — embedded text strings ───────────────
        'word.occupationTitle': 'Titre de la profession : {{title}}',
        'word.jobTitle':        'Titre du poste : {{title}}',
        'word.sector':          'Secteur : {{name}}',
        'word.dacumDate':       'Date DACUM : {{date}}',
        'word.producedFor':     'Préparé pour : {{name}}',
        'word.producedBy':      'Préparé par : {{name}}',
        'word.dutiesAndTasks':  'Fonctions et tâches',
        'word.additionalInfo':  'Informations complémentaires',
        'word.dutyLabel':       'FONCTION {{letter}} : {{title}}',
        'word.taskLabel':       'Tâche {{letter}}{{n}} : {{text}}',

        // ── Copyright ─────────────────────────────────────────
        'copyright.main':
            '© 2026 DACUM Lite | par Husham Jawad Kadhim | Version 3.1.0 | Tous droits réservés',
        'copyright.disclaimer':
            'Cet outil est fourni "tel quel" sans garantie d\u2019aucune sorte. Le développeur décline ' +
            'toute responsabilité concernant les inexactitudes, erreurs, omissions ou incohérences dans les ' +
            'documents générés. Les utilisateurs sont seuls responsables de la vérification et de la validation ' +
            'de tout contenu avant utilisation.',

        // ── Help Center ───────────────────────────────────────
        'help.heroTitle':       "Centre d'aide",
        'help.heroSub':         'Tout ce dont vous avez besoin pour utiliser DACUM Lite efficacement',
        'help.quickStartTitle': 'Démarrage rapide : comment utiliser DACUM Lite',

        'help.step1':  "Entrez le <strong>Secteur</strong>, le <strong>Titre de la profession</strong> et le <strong>Titre du poste</strong> dans l'onglet <em>Infos du graphique</em>.",
        'help.step2':  "Ajoutez un <strong>Champ d'application</strong> pour définir les limites de la profession.",
        'help.step3':  "Allez dans <em>Fonctions et tâches</em> — chaque nouvelle fonction commence automatiquement avec une tâche.",
        'help.step4':  "Utilisez <strong>➕ Ajouter une tâche</strong> dans chaque fonction. Les fonctions sont étiquetées <strong>A, B, C…</strong> et les tâches <strong>A1, A2, B1…</strong> automatiquement.",
        'help.step5':  "<strong>Glissez-déposez</strong> n'importe quelle tâche ou fonction pour la réorganiser — les étiquettes se mettent à jour instantanément.",
        'help.step6':  "Basculez vers la <strong>🃏 Vue en cartes</strong> ou la <strong>🧱 Vue murale</strong> pour différents modes d'affichage.",
        'help.step7':  "Complétez les <em>Infos complémentaires</em> (Connaissances, Habiletés, Outils, Tendances…) selon vos besoins.",
        'help.step8':  "Complétez le <strong>Panel de l'atelier</strong> (Animateurs, Observateurs, Membres du panel) dans Infos du graphique.",
        'help.step9':  "<strong>Exportez</strong> en PDF ou en document Word depuis la barre d'outils supérieure.",
        'help.step10': "Utilisez les <strong>📸 Instantanés</strong> pour enregistrer des versions nommées avant des modifications importantes.",

        'help.tipUndoTitle':     'Annuler / Rétablir',
        'help.tipUndoText':      "Chaque action est réversible. Utilisez Ctrl+Z / Ctrl+Y ou les boutons de la barre d'outils.",
        'help.tipAutoSaveTitle': 'Enregistrement automatique',
        'help.tipAutoSaveText':  'Votre travail est enregistré automatiquement dans le navigateur. Utilisez les Projets pour gérer plusieurs graphiques.',
        'help.tipWallTitle':     'Vue murale',
        'help.tipWallText':      "Modifiez, réorganisez, ajoutez et supprimez des fonctions et tâches directement sur le mur — sans changer de vue.",
        'help.tipPrintTitle':    'Impression du mur',
        'help.tipPrintText':     "Utilisez le bouton d'impression dans la Vue murale pour une sortie A3 paysage — idéal pour la projection en atelier.",

        'help.userGuideTitle':  "Guide de l'utilisateur",
        'help.userGuideDesc':   "Accédez à la documentation complète de DACUM Lite — comprend des instructions détaillées, des captures d'écran et les meilleures pratiques.",
        'help.openUserGuide':   "📘 Ouvrir le guide de l'utilisateur",
        'help.viewNewTab':      '🔗 Afficher dans un nouvel onglet',
        'help.qrCaption':       "Scannez pour ouvrir le guide de l'utilisateur sur votre mobile",

        'help.aboutTitle':      'À propos du créateur',
        'help.creatorRole':     'Créateur de DACUM Lite',
        'help.creatorBio':      "Développeur de programmes d'EFTP et innovateur en technologie éducative",
        'help.emailLabel':      'COURRIEL',
        'help.linkedinLabel':   'LINKEDIN',
        'help.getInTouchTitle': 'Nous contacter',
        'help.getInTouchText':  'Pour toute question, commentaire, suggestion ou opportunité de collaboration, veuillez nous contacter via les coordonnées ci-dessus.',

        // Disclaimer — shown only in Help tab
        'help.disclaimerTitle': 'Avertissement',
        'help.disclaimerText':  'Cet outil est fourni "tel quel" sans garantie d\u2019aucune sorte. Le développeur décline toute responsabilité concernant les inexactitudes, erreurs, omissions ou incohérences dans les documents générés. Les utilisateurs sont seuls responsables de la vérification et de la validation de tout contenu avant utilisation.',
    },

    // ══════════════════════════════════════════════════════════
    //  ARABIC
    // ══════════════════════════════════════════════════════════
    ar: {

        // ── Language toggle ───────────────────────────────────
        'lang.switchTo': 'EN',

        // ── Sidebar — brand ───────────────────────────────────
        'sidebar.brandTagline': 'مولّد مخططات داكم',

        // ── Sidebar — navigation ──────────────────────────────
        'sidebar.navLabel':           'التنقل',
        'sidebar.nav.chartInfo':      'معلومات المخطط',
        'sidebar.nav.dutiesTasks':    'الواجبات والمهام',
        'sidebar.nav.additionalInfo': 'معلومات إضافية',
        'sidebar.nav.help':           'المساعدة',

        // ── Sidebar — projects section ────────────────────────
        'sidebar.projectsLabel':     '📁 المشاريع',
        'sidebar.newBtn':            '+ جديد',
        'sidebar.searchPlaceholder': '🔍  البحث في المشاريع…',
        'sidebar.installApp':        'تثبيت التطبيق',
        'sidebar.noProjects':        'لا توجد مشاريع',

        // ── Sidebar — project counts ──────────────────────────
        'sidebar.projectCount.one':   'مشروع واحد',
        'sidebar.projectCount.other': '{{n}} مشاريع',
        'sidebar.dutyCount.one':      'واجب واحد',
        'sidebar.dutyCount.other':    '{{n}} واجبات',

        // ── Relative time ─────────────────────────────────────
        'time.justNow':    'الآن',
        'time.minutesAgo': 'منذ {{n}} د',
        'time.hoursAgo':   'منذ {{n}} س',
        'time.daysAgo':    'منذ {{n}} ي',

        // ── Project actions ───────────────────────────────────
        'project.renameTip':          'إعادة تسمية المشروع',
        'project.deleteTip':          'حذف المشروع',
        'project.untitled':           'مشروع بدون اسم',
        'project.prompt.new':         'اسم المشروع:',
        'project.prompt.newDefault':  'مشروع جديد',
        'project.prompt.rename':      'إعادة تسمية المشروع:',
        'project.alert.cannotDelete': 'لا يمكن حذف المشروع الوحيد.',
        'project.confirm.delete':     'حذف "{{name}}"؟\nلا يمكن التراجع عن هذا الإجراء.',

        // ── Status — project operations ───────────────────────
        'status.projectImported': 'تم استيراد المشروع "{{name}}" ✓',
        'status.projectCreated':  'تم إنشاء "{{name}}" ✓',
        'status.projectSwitched': 'تم التبديل إلى "{{name}}" ✓',
        'status.projectDeleted':  'تم حذف المشروع. تم التبديل إلى "{{name}}"',

        // ── Top Toolbar ───────────────────────────────────────
        'toolbar.snapshot':      'لقطة',
        'toolbar.exportProject': 'تصدير المشروع',
        'toolbar.export':        'تصدير',
        'toolbar.importProject': 'استيراد مشروع',
        'toolbar.import':        'استيراد',
        'toolbar.pdf':           'PDF',
        'toolbar.word':          'Word',
        'toolbar.clearAll':      'مسح الكل',
        'toolbar.clear':         'مسح',
        'toolbar.undo':          'تراجع',
        'toolbar.redo':          'إعادة',

        // ── Tab 1 — Chart Info ────────────────────────────────
        'chartInfo.heading':             'معلومات مخطط DACUM البحثي',
        'chartInfo.dacumDate':           '📅 تاريخ DACUM:',
        'chartInfo.producedFor':         '🏢 أُعِدَّ لـ:',
        'chartInfo.producedFor.ph':      'مثال: اسم الشركة أو المؤسسة',
        'chartInfo.producedBy':          '🎓 أُعِدَّ بواسطة:',
        'chartInfo.producedBy.ph':       'مثال: اسم مؤسسة التدريب',
        'chartInfo.sector':              '🏭 القطاع:',
        'chartInfo.sector.ph':           'مثال: الصناعي',
        'chartInfo.occupationTitle':     '💼 المهنة:',
        'chartInfo.occupationTitle.ph':  'مثال: فني سيارات',
        'chartInfo.jobTitle':            '👔 العمل:',
        'chartInfo.jobTitle.ph':         'مثال: فني خدمة المستوى الثاني',
        'chartInfo.noImage':             'لا توجد صورة',
        'chartInfo.addLogo':             '🖼️ إضافة شعار',
        'chartInfo.remove':              '🗑️ حذف',
        'chartInfo.scopeLabel':          '📋 نطاق العمل / التعريف المهني:',
        'chartInfo.scopeHint':           'فقرة موجزة تصف ما يشمله المجال المهني وحدوده. تُستخدم في التصدير ومرجعاً لاشتقاق الواجبات والمهام.',
        'chartInfo.scopePlaceholder':    'يحدد المسؤوليات الرئيسية وحدود هذه المهنة في سياق العمل. يتضمن المهام النموذجية والأدوات وبيئات العمل، ويستثني الأدوار أو الوظائف التي تندرج ضمن مهن أو تخصصات أخرى.',
        'chartInfo.workshopPanel':       '👥 لجنة ورشة العمل',
        'chartInfo.facilitators':        '👥 الميسِّرون:',
        'chartInfo.facilitators.ph':     'أدخل أسماء الميسِّرين (اسم في كل سطر)',
        'chartInfo.observers':           '👁️ المراقبون:',
        'chartInfo.observers.ph':        'أدخل أسماء المراقبين (اسم في كل سطر)',
        'chartInfo.panelMembers':        '🎯 أعضاء اللجنة:',
        'chartInfo.panelMembers.ph':     'أدخل أسماء أعضاء اللجنة (اسم في كل سطر)',

        // ── Tab 2 — Duties & Tasks ────────────────────────────
        'duties.heading':     'الواجبات والمهام',
        'duties.addDuty':     '➕ إضافة واجب',
        'duties.cardHeading': '🃏 عرض البطاقات — الواجبات والمهام',
        'duties.viewTable':   '📋 جدول',
        'duties.viewCard':    '🃏 بطاقات',
        'duties.viewWall':    '🧱 الجدار',

        // ── Tab 3 — Additional Info ───────────────────────────
        'additionalInfo.heading':    'معلومات إضافية',
        'additionalInfo.intro':      '📝 أدخل المعلومات لكل قسم. انقر على زر إعادة التسمية لتخصيص عناوين الأقسام.',
        'additionalInfo.rename':     '✏️ إعادة تسمية',
        'additionalInfo.clear':      '🗑️ مسح',
        'additionalInfo.addSection': '➕ إضافة قسم',
        'section.removeBtn':         '❌ حذف',

        // Default section headings
        'section.knowledge': 'متطلبات المعرفة',
        'section.skills':    'متطلبات المهارات',
        'section.behaviors': 'سلوكيات وصفات العامل',
        'section.tools':     'الأدوات والمعدات والمستلزمات والمواد',
        'section.trends':    'الاتجاهات والمخاوف المستقبلية',
        'section.acronyms':  'المختصرات',
        'section.careerPath':'المسار المهني',
        'section.custom':    'قسم مخصص {{n}}',

        // Additional Info — textarea placeholders
        'section.knowledge.ph':
            'أدخل كل متطلب معرفي في سطر جديد\nمثال:\n• فهم الأنظمة الكهربائية\n• معرفة بروتوكولات السلامة\n• الإلمام بأدوات التشخيص',
        'section.skills.ph':
            'أدخل كل متطلب مهاري في سطر جديد\nمثال:\n• القدرة على قراءة المخططات التقنية\n• الكفاءة في استخدام الأدوات اليدوية\n• مهارات حل المشكلات',
        'section.behaviors.ph':
            'أدخل كل سلوك أو صفة في سطر جديد\nمثال:\n• الاهتمام بالتفاصيل\n• مهارات التواصل الجيد\n• العمل ضمن فريق\n• الوعي بالسلامة',
        'section.tools.ph':
            'أدخل كل أداة أو معدة في سطر جديد\nمثال:\n• مقياس متعدد رقمي\n• مفتاح صدم هوائي\n• نظارات السلامة\n• رافعة هيدروليكية',
        'section.trends.ph':
            'أدخل كل اتجاه أو مخاوف في سطر جديد\nمثال:\n• تزايد استخدام السيارات الكهربائية\n• أنظمة مساعدة القيادة المتقدمة\n• متطلبات الاستدامة\n• الأتمتة في التصنيع',
        'section.acronyms.ph':
            'أدخل المختصرات وتعريفاتها في أسطر منفصلة\nمثال:\n• OBD - التشخيص المدمج\n• ECU - وحدة التحكم بالمحرك\n• ABS - نظام منع الانزلاق',
        'section.careerPath.ph':
            'أدخل معلومات التطور المهني في أسطر منفصلة\nمثال:\n• المستوى الأول: متدرب فني\n• المستوى المتوسط: فني معتمد\n• متقدم: فني أول / متخصص\n• الإدارة: رئيس ورشة / مدير خدمة',
        'section.custom.ph':
            'أدخل معلومات هذا القسم المخصص في أسطر منفصلة',

        // ── Snapshot Panel ────────────────────────────────────
        'snapshot.panelTitle':       '📸 اللقطات المحفوظة',
        'snapshot.empty':            'لا توجد لقطات بعد. انقر 📸 لحفظ واحدة.',
        'snapshot.restore':          'استعادة',
        'snapshot.dutyCount.one':    'واجب واحد',
        'snapshot.dutyCount.other':  '{{n}} واجبات',
        'snapshot.prompt':           'اسم اللقطة (اتركه فارغاً للتسمية التلقائية):',
        'snapshot.autoName':         'لقطة {{n}}',

        // ── Status — snapshots ────────────────────────────────
        'status.snapshotSaved':    'تم حفظ اللقطة: "{{label}}" ✓',
        'status.snapshotRestored': 'تم استعادة اللقطة: "{{label}}" ✓',

        // ── Status — undo / redo ──────────────────────────────
        'status.undone': '↩ تم التراجع: {{type}}',
        'status.redone': '↪ تم الإعادة: {{type}}',

        // ── Confirm / Alert dialogs ───────────────────────────
        'confirm.clearDuty':    'هل أنت متأكد من مسح هذا الواجب وجميع مهامه؟',
        'confirm.clearAll':     'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!',
        'confirm.removeImage':  'هل أنت متأكد من حذف هذا الشعار؟',
        'confirm.clearSection': 'هل أنت متأكد من مسح هذا القسم؟',
        'confirm.removeSection':'هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء!',
        'confirm.removeDuty':   'هل تريد حذف هذا الواجب وجميع مهامه؟',
        'confirm.wallDelDuty':  'حذف "{{title}}" وجميع مهامه؟',

        // ── Status — duties & tasks ───────────────────────────
        'status.dutyCleared':        'تم مسح الواجب! ✓',
        'status.allCleared':         'تم مسح جميع البيانات! ✓',
        'status.headingUpdated':     'تم تحديث العنوان! ✓',
        'status.sectionCleared':     'تم مسح القسم! ✓',
        'status.customSectionAdded': 'تم إضافة القسم المخصص! ✓',
        'status.sectionRemoved':     'تم حذف القسم! ✓',

        // ── Status — images ───────────────────────────────────
        'status.imageBadType':   'يرجى رفع ملف صورة صالح (JPG أو JPEG أو PNG أو BMP)',
        'status.imageUploaded':  'تم رفع الصورة بنجاح! ✓',
        'status.imageRemoved':   'تم حذف الصورة! ✓',

        // ── Status — save / load ──────────────────────────────
        'status.dataSaved':      'تم حفظ البيانات بنجاح! ✓',
        'status.dataSaveError':  'خطأ في حفظ البيانات: {{msg}}',
        'status.dataLoaded':     'تم تحميل البيانات بنجاح! ✓',
        'status.jsonParseError': 'خطأ: ملف JSON غير صالح',
        'status.fileLoadError':  'خطأ في تحميل الملف: {{msg}}',

        // ── Status — export ───────────────────────────────────
        'status.wordLibMissing':  'خطأ: مكتبة تصدير Word غير محملة. يرجى تحديث الصفحة.',
        'status.wordGenerating':  'جاري إنشاء مستند Word...',
        'status.wordExported':    'تم تصدير مستند Word بنجاح! ✓',
        'status.wordExportError': 'خطأ في إنشاء مستند Word: {{msg}}',
        'status.pdfMissingFields':'يرجى ملء المهنة والعمل على الأقل',
        'status.pdfGenerating':       'جاري إنشاء ملف PDF، يُرجى الانتظار…',
        'status.html2canvasMissing':  'مكتبة html2canvas غير محملة. تحقق من الاتصال بالإنترنت.',
        'status.pdfNoDuties':     'يرجى إضافة واجب واحد على الأقل مع مهامه',
        'status.pdfExported':     'تم تصدير PDF بنجاح! ✓',
        'status.pdfExportError':  'خطأ في إنشاء PDF: {{msg}}',

        // ── Renderer — table view ─────────────────────────────
        'renderer.dutyLabel':        'الواجب {{letter}}',
        'renderer.dragDuty':         'اسحب لإعادة الترتيب',
        'renderer.dragTask':         'اسحب لإعادة الترتيب أو النقل إلى واجب آخر',
        'renderer.clearDutyBtn':     '🗑️ مسح',
        'renderer.removeDutyBtn':    '🗑️ حذف الواجب',
        'renderer.addTaskBtn':       '➕ إضافة مهمة',
        'renderer.dutyPlaceholder':  'أدخل وصف الواجب',
        'renderer.taskPlaceholder':  'أدخل وصف المهمة',

        // ── Renderer — card view ──────────────────────────────
        'renderer.noDuties':            'لم تُضَف واجبات بعد.',
        'renderer.noTasks':             'لا توجد مهام بعد.',
        'renderer.removeDutyTitle':     'حذف الواجب',
        'renderer.removeTaskTitle':     'حذف المهمة',
        'renderer.dragTaskCard':        'اسحب لإعادة الترتيب أو النقل',
        'renderer.addTaskCard':         '➕ مهمة',
        'renderer.addTaskCardTitle':    'إضافة مهمة إلى هذا الواجب',
        'renderer.dutyPlaceholderCard': 'أدخل الواجب',
        'renderer.taskPlaceholderCard': 'أدخل المهمة',

        // ── Renderer — wall view ──────────────────────────────
        'renderer.wallNoDuties':        'لم تُضَف واجبات بعد. انتقل إلى تبويب الواجبات والمهام لإضافتها.',
        'renderer.wallNoTasks':         'لا توجد مهام — أفلت هنا أو استخدم ＋',
        'renderer.wallDutyBadge':       'الواجب {{letter}}',
        'renderer.wallTaskLabel':       'المهمة {{letter}}{{n}}',
        'renderer.wallDragDuty':        'اسحب لإعادة الترتيب',
        'renderer.wallDragTask':        'اسحب لإعادة الترتيب أو النقل إلى واجب آخر',
        'renderer.wallAddDutyTitle':    'إضافة واجب أدناه',
        'renderer.wallDelDutyTitle':    'حذف هذا الواجب',
        'renderer.wallDelDutyConfirm':  'حذف "{{title}}" وجميع مهامه؟',
        'renderer.wallAddTaskTitle':    'إضافة مهمة بعد هذه',
        'renderer.wallDelTaskTitle':    'حذف هذه المهمة',
        'renderer.wallDutyPlaceholder': 'أدخل الواجب…',
        'renderer.wallTaskPlaceholder': 'أدخل المهمة…',

        // ── InfoBox ───────────────────────────────────────────
        'infobox.hide': 'إخفاء',
        'infobox.show': 'إظهار',

        // ── Wall View overlay controls ────────────────────────
        'wall.exit':           '✕ خروج',
        'wall.reset':          '↺ إعادة ضبط',
        'wall.print':          '🖨️ طباعة',
        'wall.full':           '⛶ ملء',
        'wall.title':          '🧱 عرض الجدار',
        'wall.fullscreen':     '⛶ ملء الشاشة',
        'wall.exitFullscreen': '⛶ إنهاء ملء الشاشة',

        // ── Wall View — view tabs ─────────────────────────────
        'wall.tabCard':  '🃏 بطاقات',
        'wall.tabTable': '📋 جدول',
        'wall.tabWall':  '🧱 الجدار',

        // ── File Engine ───────────────────────────────────────
        'fileEngine.exportFailed':      'فشل التصدير:\n\n{{msg}}',
        'fileEngine.readFailed':        'تعذّر قراءة الملف المحدد.\nيرجى التحقق من الملف والمحاولة مرة أخرى.',
        'fileEngine.importInvalidJson': 'الملف المحدد ليس JSON صالحاً.\nقد يكون تالفاً أو بتنسيق خاطئ.',
        'fileEngine.importFailed':      'فشل الاستيراد — هذا ليس ملف مشروع DACUM صالحاً.\n\nالسبب: {{reason}}',
        'fileEngine.importError':       'فشل الاستيراد:\n\n{{msg}}',
        'fileEngine.importedSuffix':    ' (مستورد)',

        // ── PDF export — embedded text strings ───────────────
        // ملاحظة: دعم الخطوط العربية في jsPDF يتطلب مكوناً إضافياً
        // (مثل jsPDF-CustomFonts-support أو arabic-pdf-plugin).
        // حتى يتم التكامل، لن يُعرض النص العربي بشكل صحيح في ملفات PDF المُصدَّرة.
        // تبديل لغة الواجهة لا يؤثر على جودة التصدير.
        'pdf.chartTitle':        'مخطط DACUM البحثي لـ {{title}}',
        'pdf.producedFor':       'أُعِدَّ لـ',
        'pdf.producedBy':        'أُعِدَّ بواسطة',
        'pdf.sector':            'القطاع:',
        'pdf.occupationTitle':   'المهنة:',
        'pdf.jobTitle':          'العمل:',
        'pdf.dutiesAndTasks':    'الواجبات والمهام',
        'pdf.dutiesAndTasksCont':'الواجبات والمهام (تابع)',
        'pdf.generalKnowledge':  'المعرفة والمهارات العامة',
        'pdf.dutyLabel':         'الواجب {{letter}}: {{title}}',
        'pdf.taskLabel':         'المهمة {{letter}}{{n}}:',

        // ── Word export — embedded text strings ───────────────
        // ملاحظة: دعم RTL الكامل في docx يتطلب تضمين خط عربي في المستند
        // وإضافة خاصية bidirectional: true على كل Paragraph/TextRun.
        // هذا التحسين مرحلي ويحتاج معالجة لاحقة.
        'word.occupationTitle': 'المهنة: {{title}}',
        'word.jobTitle':        'العمل: {{title}}',
        'word.sector':          'القطاع: {{name}}',
        'word.dacumDate':       'تاريخ DACUM: {{date}}',
        'word.producedFor':     'أُعِدَّ لـ: {{name}}',
        'word.producedBy':      'أُعِدَّ بواسطة: {{name}}',
        'word.dutiesAndTasks':  'الواجبات والمهام',
        'word.additionalInfo':  'معلومات إضافية',
        'word.dutyLabel':       'الواجب {{letter}}: {{title}}',
        'word.taskLabel':       'المهمة {{letter}}{{n}}: {{text}}',

        // ── Copyright ─────────────────────────────────────────
        'copyright.main':
            '© 2026 DACUM Lite | بقلم هشام جواد كاظم | الإصدار 3.1.0 | جميع الحقوق محفوظة',
        'copyright.disclaimer':
            'تُقدَّم هذه الأداة "كما هي" دون أي ضمان من أي نوع. لا يتحمل المطوّر أي مسؤولية ' +
            'عن أي معلومات غير دقيقة أو أخطاء أو حذف أو تناقضات في الوثائق المُنشأة. ' +
            'يتحمل المستخدمون المسؤولية الكاملة عن التحقق من جميع المحتويات قبل استخدامها.',

        // ── Help Center ───────────────────────────────────────
        'help.heroTitle':       'مركز المساعدة',
        'help.heroSub':         'كل ما تحتاجه لاستخدام DACUM Lite بفاعلية',
        'help.quickStartTitle': 'البداية السريعة: كيفية استخدام DACUM Lite',

        'help.step1':  'أدخل <strong>القطاع</strong> و<strong>المهنة</strong> و<strong>العمل</strong> في تبويب <em>معلومات المخطط</em>.',
        'help.step2':  'أضف <strong>نطاق العمل</strong> لتحديد الحدود المهنية.',
        'help.step3':  'انتقل إلى <em>الواجبات والمهام</em> — كل واجب جديد يبدأ بمهمة واحدة تلقائياً.',
        'help.step4':  'استخدم <strong>➕ إضافة مهمة</strong> داخل كل واجب. تُسمَّى الواجبات <strong>A, B, C…</strong> والمهام <strong>A1, A2, B1…</strong> تلقائياً.',
        'help.step5':  '<strong>اسحب وأفلت</strong> أي مهمة أو واجب لإعادة الترتيب — تتحدث التسميات فوراً.',
        'help.step6':  'بدّل إلى <strong>🃏 عرض البطاقات</strong> أو <strong>🧱 عرض الجدار</strong> للأوضاع المختلفة.',
        'help.step7':  'أكمل <em>المعلومات الإضافية</em> (المعرفة والمهارات والأدوات والاتجاهات…) حسب الحاجة.',
        'help.step8':  'أكمل <strong>لجنة ورشة العمل</strong> (الميسِّرون والمراقبون وأعضاء اللجنة) في معلومات المخطط.',
        'help.step9':  '<strong>صدِّر</strong> كملف PDF أو Word من شريط الأدوات العلوي.',
        'help.step10': 'استخدم <strong>📸 اللقطات</strong> لحفظ نسخ مسماة قبل التعديلات الكبرى.',

        'help.tipUndoTitle':     'تراجع / إعادة',
        'help.tipUndoText':      'كل إجراء قابل للتراجع. استخدم Ctrl+Z / Ctrl+Y أو أزرار شريط الأدوات.',
        'help.tipAutoSaveTitle': 'حفظ تلقائي',
        'help.tipAutoSaveText':  'يُحفظ عملك تلقائياً في المتصفح. استخدم المشاريع لإدارة مخططات متعددة.',
        'help.tipWallTitle':     'عرض الجدار',
        'help.tipWallText':      'عدّل وأعد الترتيب وأضف واحذف الواجبات والمهام مباشرة على الجدار — دون الحاجة لتبديل العروض.',
        'help.tipPrintTitle':    'طباعة الجدار',
        'help.tipPrintText':     'استخدم زر الطباعة داخل عرض الجدار للحصول على مخرجات A3 أفقي — مثالي لعرض ورش العمل.',

        'help.userGuideTitle':  'دليل المستخدم',
        'help.userGuideDesc':   'اطّلع على الوثائق الكاملة لـ DACUM Lite — تتضمن تعليمات مفصّلة ولقطات شاشة وأفضل الممارسات.',
        'help.openUserGuide':   '📘 فتح دليل المستخدم',
        'help.viewNewTab':      '🔗 عرض في تبويب جديد',
        'help.qrCaption':       'امسح الرمز لفتح دليل المستخدم على هاتفك',

        'help.aboutTitle':      'عن المطوّر',
        'help.creatorRole':     'مبتكر DACUM Lite',
        'help.creatorBio':      'مطوّر مناهج التدريب المهني والتقني ومبتكر تكنولوجيا التعليم',
        'help.emailLabel':      'البريد الإلكتروني',
        'help.linkedinLabel':   'لينكد إن',
        'help.getInTouchTitle': 'تواصل معنا',
        'help.getInTouchText':  'للاستفسارات والملاحظات والاقتراحات وفرص التعاون، يرجى التواصل عبر معلومات الاتصال أعلاه.',

        // Disclaimer — shown only in Help tab
        'help.disclaimerTitle': 'إخلاء مسؤولية',
        'help.disclaimerText':  'تُقدَّم هذه الأداة "كما هي" دون أي ضمان من أي نوع. لا يتحمل المطوّر أي مسؤولية عن أي معلومات غير دقيقة أو أخطاء أو حذف أو تناقضات في الوثائق المُنشأة. يتحمل المستخدمون المسؤولية الكاملة عن التحقق من جميع المحتويات قبل استخدامها.',
    }
};
