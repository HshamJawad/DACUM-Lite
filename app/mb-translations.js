// ============================================================
// /src/mb-translations.js
// Interface dictionaries + i18n engine.
//
// The engine block below is DACUM Live Pro's, carried over unchanged
// except for the storage key and the RTL body class. Reimplementing it
// would have meant rediscovering the same four bugs it already encodes:
// comma-separated attribute lists, the user-edited-text guard, the
// refusal to overwrite elements that wrap children, and the stale-text
// audit.
//
// CONTENT IS NOT TRANSLATED HERE. This file holds only what the tool
// says; what the user writes lives in { en, ar } pairs (bilang.js) and
// is switched separately. Confusing the two is the single most common
// way a bilingual tool corrupts its own data.
//
// Storage key is `dacum_lang`, deliberately shared with DACUM Live Pro:
// a curriculum developer moving between the two tools in one session
// should not have to set the language twice.
// ============================================================

(function () {
  'use strict';

  var TRANSLATIONS = {

    en: {
      mbModuleBuilderV20: "Module Builder V 2.0",
      mbACompetencyBasedTrainingModuleDevelopm: "A competency-based training module development tool for structuring learning outcomes, activities, and assessments.",
      mbBasicInfo: "🏠 Basic Info",
      mbCovers: "Covers",
      mbIntroductionPages: "Introduction Pages",
      mbInformationSheet: "Information Sheet",
      mbActivityJobSheet: "Activity/ Job Sheet",
      mbAssessmentUnit: "Assessment Unit",
      mbReferences: "📚 References",
      mbHelp: "❓ Help",
      mbClearImportedStructureStartManualAutho: "🧹 Clear Imported Structure & Start Manual Authoring",
      mbModuleManagement: "📦 Module Management",
      mbAddModule: "➕ Add Module",
      mbCurrentModule: "Current Module:",
      mbSelectModule: "-- Select Module --",
      mbRename: "✏️ Rename",
      mbDelete: "🗑️ Delete",
      mbLearningOutcomes: "📚 Learning Outcomes:",
      mbTotalSheets: "📄 Total Sheets:",
      mbLearningOutcomeManagement: "📚 Learning Outcome Management",
      mbAddLearningOutcome: "➕ Add Learning Outcome",
      mbCurrentLearningOutcome: "Current Learning Outcome:",
      mbSelectLearningOutcome: "-- Select Learning Outcome --",
      mbModule: "📦 Module:",
      mbInformationSheets: "📄 Information Sheets:",
      mbActivitySheets: "⚡ Activity Sheets:",
      mbAddCriterion: "➕ Add Criterion",
      mbNoPerformanceCriteriaAvailable: "No performance criteria available",
      mbFrontCover: "🖼️ Front Cover",
      mbOptionalExportedAsTheVeryFirst: "(Optional — exported as the very first page)",
      mbTip: "Tip:",
      mbA4SizedImage210297Mm: "A4-sized image (210 × 297 mm)",
      mb24803508Px: "2480 × 3508 px",
      mb12401754Px: "1240 × 1754 px",
      mbClickOrDragDropToUpload: "Click or drag & drop to upload front cover image",
      mbPngJpgWebpWillBeStretched: "PNG, JPG, WEBP — will be stretched to fill full A4 page (210 × 297 mm)",
      mbImageLoadedWillBeTheFirst: "✓ Image loaded — will be the first page on export. Click to replace.",
      mbRemoveFrontCoverImage: "🗑️ Remove Front Cover Image",
      mbCoverPageInformation: "📋 Cover Page Information",
      mbAdditionalInformationOptional: "Additional Information (Optional)",
      mbProjectNameInstitutionEtc: "Project name, institution, etc.",
      mbEnterAnyAdditionalInformationEG: "Enter any additional information (e.g., Project name, Institution name, etc.)...",
      mbModuleInformationTable: "Module Information Table",
      mbAddCustomRow: "➕ Add Custom Row",
      mbFillInTheModuleDetailsBelow: "Fill in the module details below. Click \"Rename\" to customize field labels.",
      mbTableRowsWillBeAddedHere: "Table rows will be added here dynamically",
      mbAdditionalNotesOptional: "Additional Notes (Optional)",
      mbExtraInformationAfterTheTable: "Extra information after the table",
      mbEnterAnyAdditionalNotesToAppear: "Enter any additional notes to appear after the module information table...",
      mbBackCover: "🖼️ Back Cover",
      mbOptionalExportedAsTheLastPage: "(Optional — exported as the last page)",
      mbClickOrDragDropToUpload2: "Click or drag & drop to upload back cover image",
      mbImageLoadedWillFillFullA4: "✓ Image loaded — will fill full A4 page on export. Click to replace.",
      mbRemoveBackCoverImage: "🗑️ Remove Back Cover Image",
      mbProceedToIntroductionPages: "Proceed to Introduction Pages →",
      mbIntroductionPages2: "📄 Introduction Pages",
      mbWorkTeam: "Work Team",
      mbAddTeamMember: "➕ Add Team Member",
      mbAddTeamMembersWhoWorkedOn: "Add team members who worked on this module. This will appear on a new page after the cover.",
      mbTeamMembersWillBeAddedHere: "Team members will be added here dynamically",
      mbAdditionalIntroductionDetailsOptional: "Additional Introduction Details (Optional)",
      mbStartsOnNewPageIfFilled: "Starts on new page if filled",
      mbExtraIntroductionSections: "Extra Introduction Sections (Optional)",
      mbEachSectionStartsOnNewPage: "Each section starts on a new page — empty sections are not exported",
      mbAddIntroductionSection: "➕ Add Introduction Section",
      mbModuleContents: "Module Contents",
      mbLearningOutcomeSections: "Learning Outcome Sections (Optional)",
      mbEmptySectionsNotExported: "Empty sections are not exported",
      mbAddSection: "➕ Add Section",
      mbSectionTitlePlaceholder: "Section title — appears as the heading in the exported file",
      mbSectionBodyPlaceholder: "Leave empty to keep this section out of the exported file…",
      mbRemoveSection: "Remove section",
      dgImageOptimized: "Image optimized: {v0} → {v1}",
      dgSectionAdded: "Section added",
      dgSectionDeleted: "Section deleted",
      dgConfirmDeleteSection: "Delete this section?\n\nIts title and text will be lost. Continue?",
      mbEnterAnyAdditionalIntroductionContentA: "Enter any additional introduction content (acknowledgments, foreword, etc.). This will start on a new page if filled...",
      mbProceedToInformationSheet: "Proceed to Information Sheet →",
      mbLearningOutcome: "📚 Learning Outcome:",
      mbRemoveSheet: "🗑️ Remove Sheet",
      mbPreviousInfoSheet: "Previous Info Sheet",
      mbSheet1Of1: "Sheet 1 of 1",
      mbNextInfoSheet: "Next Info Sheet",
      mbAddInfoSheet: "➕ Add Info Sheet",
      mbInformationSheetTitle: "Information Sheet Title:",
      mbEnterInformationSheetTitle: "Enter information sheet title...",
      mbObjective: "Objective:",
      mbNumber: "🔢 Number",
      mbConvertToNumberedList: "Convert to numbered list",
      mbBullet: "• Bullet",
      mbConvertToBulletedList: "Convert to bulleted list",
      mbClear: "✖ Clear",
      mbClearFormatting: "Clear formatting",
      mbEnterTheLearningObjective: "Enter the learning objective...",
      mbContent: "Content:",
      mbQrCodeLink: "QR Code & Link:",
      mbVideoResourceSubject: "Video/Resource Subject:",
      mbEGPaintlessDentRemovalTutorial: "e.g., Paintless Dent Removal Tutorial",
      mbVideoResourceLink: "Video/Resource Link:",
      mbQrCodeImage: "QR Code Image:",
      mbUploadQrCode25cmX: "🖼️ Upload QR Code (2.5cm x 2.5cm)",
      mbSelfCheck: "Self-check:",
      mbNumberedList: "Numbered list",
      mbBulletList: "Bullet list",
      mbRemoveNumberingBullets: "Remove numbering/bullets",
      mbClearAllNumberContent: "Clear all (number + content)",
      mbEnterSelfCheckQuestionsAndContent: "Enter self-check questions and content...",
      mbAnswersKey: "Answers-Key:",
      mbEnterAnswersKeyContent: "Enter answers-key content...",
      mbProceedToActivityJobSheet: "Proceed to Activity / Job Sheet →",
      mbPreviousActivitySheet: "Previous Activity Sheet",
      mbNextActivitySheet: "Next Activity Sheet",
      mbAddActivitySheet: "➕ Add Activity Sheet",
      mbActivitySheetTitle: "Activity Sheet Title:",
      mbEnterActivitySheetTitle: "Enter activity sheet title...",
      mbEnterTheLearningObjectiveForThis: "Enter the learning objective for this activity...",
      mbDurationMinutes: "Duration (minutes):",
      mbExample45Minutes: "Example: 45 minutes",
      mbTrainingResources: "Training Resources:",
      mbMaterialEquipment: "Material / Equipment",
      mbQuantityNumber: "Quantity / Number",
      mbAddRow: "➕ Add Row",
      mbClearRows: "🗑️ Clear Rows",
      mbActivitySteps: "Activity Steps:",
      mbPerformanceCriteriaCheckList: "Performance Criteria Check List:",
      mbPerformanceCriteriaCheckList11: "Performance Criteria Check List/ 1-1",
      mbBeforeYouTellTheTrainerTo: "Before you tell the trainer to complete the activity... evaluate yourself by answering the following questions:",
      mbDidYou: "Did you...",
      mbThePerformanceLevelAnswerForAll: "The performance level answer for all items should be (yes). If the answer is (no), the skill should be retrained again until it is mastered.",
      mbProceedToAssessmentUnit: "Proceed to Assessment Unit →",
      mbAssessmentUnit2: "📋 Assessment Unit",
      mbAssessmentContent: "Assessment Content",
      mbInstructionsCriteriaGuidelines: "Instructions, criteria, guidelines",
      mbEnterAssessmentContentInstructionsAndC: "Enter assessment content, instructions, and criteria here...",
      mbAssessmentFormsPerLearningOutcome: "Assessment Forms per Learning Outcome",
      mbAddAssessmentForm: "➕ Add Assessment Form",
      mbRenameSectionHeading: "Rename section heading",
      mbEGSmithJ2020Vocational: "e.g. Smith, J. (2020). Vocational Training Handbook. Publisher.",
      mbAddReference: "➕ Add Reference",
      mbHelpCenter: "Help Center",
      mbEverythingYouNeedToUseModule: "Everything you need to use Module Builder effectively",
      mbQuickStartHowToUseModule: "Quick Start: How to Use Module Builder",
      mbBasicInfo2: "Basic Info",
      mbActivityJobSheet2: "Activity / Job Sheet",
      mbReferences2: "References",
      mbSaveWork: "💾 Save Work",
      mbLoadWork: "Load Work",
      mbExportToWord: "📄 Export to Word",
      mbUserGuide: "User Guide",
      mbAccessTheFullDocumentationForModule: "Access the full documentation for Module Builder — includes detailed instructions, screenshots, and best practices.",
      mbOpenUserGuide: "📖 Open User Guide",
      mbDownloadPdf: "⬇️ Download PDF",
      mbScanToOpenTheUserGuide: "Scan to open the User Guide on your mobile device.",
      mbAboutTheCreator: "About the Creator",
      mbCreatorOfModuleBuilder: "Creator of Module Builder",
      mbTvetCurriculumDeveloperEducationalTech: "TVET Curriculum Developer & Educational Technology Innovator",
      mbEmail: "Email",
      mbLinkedin: "LinkedIn",
      mbGetInTouch: "Get in Touch",
      mbForQuestionsFeedbackSuggestionsOrColla: "For questions, feedback, suggestions, or collaboration opportunities, please reach out using the contact information above.",
      mb2026ModuleBuilderByHushamJawad: "© 2026 Module Builder | by Husham Jawad Kadhim | Version 2.0 | All Rights Reserved",
      mbDisclaimer: "Disclaimer:",

      /* Used by the engine itself, not by any element in the markup. */
      dgLangLocked: "Language cannot be switched while an operation is running.",

      /* ── Strings built in JavaScript ────────────────────────────
         Dialogs, confirmations and status banners. Kept in the same
         dictionaries as the markup keys but prefixed dg-/dlg- so a
         missing one is obvious in an audit: a `dg` key showing through
         untranslated means a code path nobody switched languages on.

         {v0}, {v1} are positional — the interpolated values had no names
         in the original template literals, and inventing semantic names
         during a mechanical conversion would have meant guessing at 73
         call sites. Rename them as each message is next revisited. */
      dgNoLearningOutcomesAvailablePlease: "No Learning Outcomes available. Please add a Learning Outcome first.",
      dgAllLearningOutcomesAlreadyHave: "All Learning Outcomes already have assessment forms.",
      dgNoAssessmentFormsYet: "No assessment forms created yet. Click \"Add Assessment Form\" to create one.",
      dgClearImportedStartManual: "\u26a0\ufe0f Clear Imported Structure & Start Manual Authoring?\n\nThis will:\n\u2022 Clear all imported modules, learning outcomes, and performance criteria\n\u2022 Switch to manual authoring mode\n\u2022 You can then create your own modules from scratch\n\nThis action cannot be undone. Continue?",
      dgClearAllDataInThis: "Clear all data in this assessment form (rows, results, signatures)?",
      dgDeleteThisAssessmentFormCompletely: "Delete this assessment form completely? The Learning Outcome will not be deleted.",
      dgCannotDeleteTheLastRow: "Cannot delete the last row. Use Clear All Rows instead.",
      dgAreYouSureYouWant: "Are you sure you want to clear all rows for this Learning Outcome?",
      dgConfirmDeletionthisWillPermanently: "⚠️ Confirm Deletion\n\nThis will permanently remove this content section and its images.\nThis action cannot be undone.\n\nContinue?",
      dgConfirmDeletionthisWillPermanently2: "⚠️ Confirm Deletion\n\nThis will permanently clear all Information Sheet content including:\n• Sheet title and objective\n• All content sections and images\n• QR code and links\n• Self-check and answers\n\nThis action cannot be undone.\n\nContinue?",
      dgInformationSheetCleared: "Information sheet cleared!",
      dgEnterNewLabelName: "Enter new label name:",
      dgConfirmDeletionthisWillPermanently3: "⚠️ Confirm Deletion\n\nThis will permanently delete this cover table row.\nThis action cannot be undone.\n\nContinue?",
      dgEnterLabelForNewRow: "Enter label for new row:",
      dgConfirmDeletionthisWillPermanently4: "⚠️ Confirm Deletion\n\nThis will permanently remove this assessment criterion.\nThis action cannot be undone.\n\nContinue?",
      dgDocumentLibraryIsStillLoading: "Document library is still loading. Please wait a moment and try again.",
      dgPleaseFillInAtLeast: "Please fill in at least one tab before exporting!",
      dgExportInProgressProcessingContent: "⏳ Export in progress... Processing content and images...",
      dgDocumentExportedSuccessfullyFileMb: "✅ Document exported successfully! File: {v0} ({v1} MB)",
      dgExportFailed: "❌ Export failed: ",
      dgRemoveThisMarkThisAction: "Remove this mark?\nThis action cannot be undone.",
      dgImportedModulesWithLearningOutcome: "Imported {v0} modules with {v1} Learning Outcomes from DACUM Live Pro!",
      dgSwitchedTo: "Switched to {v0}",
      dgSwitchedTo2: "Switched to {v0}",
      dgEnterModuleTitle: "Enter Module Title:",
      dgModuleAddedYouCanNow: "Module added! You can now add Learning Outcomes to this module.",
      dgPleaseSelectAModuleFirst: "Please select a Module first!",
      dgEnterNewModuleTitle: "Enter new module title:",
      dgModuleRenamed: "Module renamed!",
      dgModuleDeleted: "Module deleted!",
      dgPleaseSelectOrCreateA: "Please select or create a Module first!",
      dgEnterLearningOutcomeTitle: "Enter Learning Outcome Title:",
      dgLearningOutcomeAdded: "Learning Outcome added!",
      dgPleaseSelectALearningOutcome: "Please select a Learning Outcome first!",
      dgEnterPerformanceCriterion: "Enter Performance Criterion:",
      dgPerformanceCriterionAdded: "Performance Criterion added!",
      dgEditPerformanceCriterion: "Edit Performance Criterion:",
      dgPerformanceCriterionCannotBeEmpty: "Performance Criterion cannot be empty!",
      dgPerformanceCriterionUpdated: "Performance Criterion updated!",
      dgConfirmDeletionthisWillPermanently5: "⚠️ Confirm Deletion\n\nThis will permanently delete this Performance Criterion.\nThis action cannot be undone.\n\nContinue?",
      dgPerformanceCriterionDeleted: "Performance Criterion deleted!",
      dgSwitchedToManualAuthoringMode: "Switched to Manual Authoring Mode! Create your modules and learning outcomes.",
      dgEnterNewTitle: "Enter new title:",
      dgLearningOutcomeRenamed: "Learning Outcome renamed!",
      dgLearningOutcomeDeleted: "Learning Outcome deleted!",
      dgEnterNewSectionTitle: "Enter new section title:",
      dgClearAllResourceRows: "Clear all resource rows?",
      dgInfoSheetAdded: "Info Sheet {v0} added!",
      dgNoInfoSheetToRemove: "No info sheet to remove.",
      dgConfirmDeletionthisWillPermanently6: "⚠️ Confirm Deletion\n\nThis will permanently remove Info Sheet {v0}.\nThis action cannot be undone.\n\nContinue?",
      dgInfoSheetRemoved: "Info Sheet removed!",
      dgActivitySheetAdded: "Activity Sheet {v0} added!",
      dgNoActivitySheetToRemove: "No activity sheet to remove.",
      dgConfirmDeletionthisWillPermanently7: "⚠️ Confirm Deletion\n\nThis will permanently remove Activity Sheet {v0}.\nThis action cannot be undone.\n\nContinue?",
      dgActivitySheetRemoved: "Activity Sheet removed!",
      dgConfirmDeletionthisWillPermanently8: "⚠️ Confirm Deletion\n\nThis will permanently remove this step and its images.\nThis action cannot be undone.\n\nContinue?",
      dgAreYouSureYouWant2: "Are you sure you want to clear this activity sheet?",
      dgActivitySheetCleared: "Activity sheet cleared!",
      dgWorkSavedSuccessfully: "Work saved successfully! ✓",
      dgErrorSavingWork: "Error saving work: ",
      dgWorkLoadedSuccessfully: "Work loaded successfully!",
      dgWorkLoadedSuccessfullyConvertedFro: "Work loaded successfully! (Converted from v2.0)",
      dgOldFormatImportedSuccessfully: "Old format imported successfully!",
      dgErrorLoadingWork: "Error loading work: ",
      dgConfirmClearAllDatathisWill: "⚠️ CONFIRM CLEAR ALL DATA\n\nThis will permanently delete:\n• All Modules and Learning Outcomes\n• All Information and Activity Sheets\n• All Cover and Introduction Pages\n• All Assessment content\n• All saved data\n\nThis action CANNOT be undone.\n\nAre you absolutely sure you want to continue?",
      dgAllDataCleared: "All data cleared!",
      dgPleaseSelectALearningOutcome2: "📚 Please select a Learning Outcome before proceeding.\n\nYou can select or create a Learning Outcome in the \"Basic Info\" tab.",
      dgWarningDocxLibraryFailedTo: "⚠️ Warning: DOCX library failed to load. Export may not work. Please check your internet connection.",
      /* Labels and placeholders built inside innerHTML templates by the
         renderers. Same problem as the dialogs: they are created after
         applyTranslations() has run, so data-i18n can never reach them —
         they have to call t() at build time instead. */
      dgDismiss: "Dismiss",
      dgAddRow: "Add row",
      dgAddColumn: "Add column",
      dgDeleteLastRow: "Delete last row",
      dgDeleteLastColumn: "Delete last column",
      dgRemoveTable: "Remove table",
      dgClearContent: "Clear content",
      dgRemoveContent: "Remove content",
      dgEnterContent: "Enter content...",
      dgAddTable: "Add Table",
      dgRemoveImage: "Remove image",
      dgEnterValue: "Enter value...",
      dgEnterCriterion: "Enter criterion...",
      dgRemoveMark: "Remove mark",
      dgMaterialOrEquipmentName: "Material or equipment name...",
      dgRemoveRow: "Remove row",
      dgClearStep: "Clear step",
      dgRemoveStep: "Remove step",
      dgDescribeThisStep: "Describe this step...",
      dgNoTeamMembersYet: "No team members added yet. Click \"Add Team Member\" to start.",

      /* ── DOCX export strings ────────────────────────────────────
         Resolved with tIn(key, exportLang()), never t(): the document
         follows the EXPORT language, which is independent of both the
         interface and the editor. An English interface exporting an
         Arabic module must produce Arabic table headers. */
      tiConvertToNumberedList: "Convert to numbered list",
      tiConvertToBulletedList: "Convert to bulleted list",
      tiClearFormatting: "Clear formatting",
      phHttps: "https://...",
      tiNumberedList: "Numbered list",
      tiBulletList: "Bullet list",
      tiRemoveNumberingBullets: "Remove numbering/bullets",
      tiRenameSectionHeading: "Rename section heading",
      mbContentLanguage: "Content language",
      mbQrCode: "QR Code",
      mbUnavailable: "Unavailable",
      tiConvertToNumberedList: "Convert to numbered list",
      tiConvertToBulletedList: "Convert to bulleted list",
      tiClearFormatting: "Clear formatting",
      phHttps: "https://...",
      tiNumberedList: "Numbered list",
      tiBulletList: "Bullet list",
      tiRemoveNumberingBullets: "Remove numbering/bullets",
      tiRenameSectionHeading: "Rename section heading",
      txModuleBuilderV20: "Module Builder V 2.0",
      txSaveWork: "Save Work",
      txLoadWork: "Load Work",
      txExportToWord: "Export to Word",
      txClearAll: "Clear All",
      txPerformanceCriteriaForThisLearning: "Performance Criteria for this Learning Outcome",
      txUploadAn: "Upload an",
      txForBestResults: "for best results.",
      txRecommended: "Recommended:",
      txAt300DpiOr: "at 300 dpi — or",
      txAt150Dpi: "at 150 dpi.",
      txSmallerImagesWillBeAutomaticallySt: "Smaller images will be automatically stretched to fill the full A4 page.",
      txNo: "No:",
      txYes: "Yes",
      txNo2: "No",
      txCreateYourModuleAddLearningOutcome: "— Create your module, add Learning Outcomes, and set module details.",
      txUploadAFrontCoverImageFill: "— Upload a front cover image, fill in the module information table, and optionally add a back cover image.",
      txAddYourWorkTeamMembersAnd: "— Add your work team members and any introductory text.",
      txSelectAModuleAndLearningOutcome: "— Select a module and learning outcome, then add information sheets with content sections, objectives, and self-check activities.",
      txSelectAModuleAndLearningOutcome2: "— Select a module and learning outcome, then add activity sheets with steps, resources, and criteria.",
      txSelectAModuleAndAddAssessment: "— Select a module and add assessment forms with criteria, verification, and signature sections.",
      txAddYourBibliographyEntriesTheseWil: "— Add your bibliography entries. These will appear as the last content page before the back cover.",
      txSaveYourProgressToAJson: "— Save your progress to a JSON file at any time. Use",
      txToRestoreItLater: "to restore it later.",
      txWhenReadyExportTheCompleteModule: "— When ready, export the complete module as a formatted DOCX file.",
      txQrCode: "QR Code",
      txUnavailable: "Unavailable",
      txModuleBuilderIsProvidedAsIs: "Module Builder is provided \"as is\" without warranty of any kind. The developer assumes no responsibility for any inaccuracies, errors, omissions, or inconsistencies in the generated documents. Users and facilitating institutions are solely responsible for verifying, validating, and making final decisions on all content before use.",
      dgAddContent: "Add Content",
      dgAddTableBtn: "Add Table",
      dgAddRowBtn: "Add Row",
      dgDeleteForm: "Delete Form",
      dgSignatures: "Signatures",
      dgTrainerSignature: "Trainer Signature",
      dgLearnerSignature: "Learner Signature",
      dgTrainerDate: "Trainer Date",
      dgLearnerDate: "Learner Date",
      dgSignaturesManual: "Signatures will be filled in manually on the printed form.",
      dgNoCriteriaAvailable: "No performance criteria available. Click \"Add Criterion\" to add one.",
      expResultPlain: "Result",
      cvSector: "Sector:",
      cvOccupation: "Occupation:",
      cvJob: "Job:",
      cvQualification: "Qualification:",
      cvModuleCode: "Module code and Title:",
      cvLevel: "Level:",
      cvVersion: "Version:",
      asRestored: "Previous session restored",
      asBackupReminder: "Don't forget to save your work (backup)",
      asSaveNow: "Save Now",
      rxClearForm: "Clear Form",
      rxActions: "Actions",
      rxClearRows: "Clear Rows",
      rxRow: "Row",
      rxCol: "Col",
      rxRemove: "Remove",
      rxAddImageS: "Add Image(s)",
      rxRename: "Rename",
      dgNoSheets: "No Sheets",
      dgDefaultLOName: "Learning Outcome {v0}",
      dgDefaultModuleName: "Module {v0}",
      dgSheetXOfY: "Sheet {v0} of {v1}",
      dgAddMark: "Add Mark",
      dgAddImages: "Add Image(s)",
      dgAddStep: "Add Step",
      dgContentN: "Content {v0}:",
      mbExportLanguage: "Export language",
      expObjective: "Objective:",
      expDuration: "Duration: ",
      expMaterialEquipment: "Material/ Equipment",
      expQuantityNumber: "Quantity/ Number",
      expActivitySteps: "Activity Steps:",
      expWorkTeam: "Work Team",
      expName: "Name",
      expTask: "Task",
      expWorkLocation: "Work location",
      expPerformanceCriteria: "Performance Criteria:",
      expTrainingResources: "Training Resources:",
      expAssessmentUnitCaps: "ASSESSMENT UNIT",
      expAssessmentUnit: "Assessment Unit",
      expPortfolioOfEvidence: "Portfolio of Evidence",
      expResult: "Result:",
      expWatchVideo: "Watch a Video...",
      expMinutes: "{v0} minutes",
      expDidYou: "Did you...",
      expYes: "Yes",
      expNo: "No",
      expAssessmentCriteria: "Assessment Criteria",
      expNameNumberActivities: "Name and Number of Learning Activities",
      expOutcomesMethod: "Outcomes or Assessment Method",
      expEvidenceVerification: "Evidence Verification",
      expCompletionDateNotes: "Completion Date or Notes",
      expReferences: "References",
      expActivitySheetTitled: "Activity/Job Sheet {v0} \\ {v1}",
      expActivitySheetUntitled: "Activity/Job Sheet \\ {v0}",
      expInfoSheetTitled: "Information Sheet {v0} \\ {v1}",
      expSelfCheck: "Self-check \\ {v0}",
      expAnswersKey: "Answers-Key \\ {v0}",
      expStepN: "Step {v0}:",
      expCriteriaCheckList: "Performance Criteria Check List/ {v0}",
      expLearningOutcomeN: "Learning Outcome {v0}: {v1}",
      expCompetent: "Competent",
      expNotYetCompetent: "Not Yet Competent",
      expTrainerName: "Trainer Name",
      expLearnerName: "Learner Name",
      expSignatureLine: "{v0}: {v1}     Signature: {v2}     Date: {v3}",
      expCriteriaInstructionDefault: "Before you tell the trainer to complete the activity... evaluate yourself by answering the following questions:",
      expCriteriaFooterDefault: "The performance level answer for all items should be (yes). If the answer is (no), the skill should be retrained again until it is mastered.",
      mkAttention: "Attention",
      mkReview: "Review",
      mkQuestion: "Question",
      mkReflect: "Reflect",
      mkNote: "Note",
      mkTip: "Tip",
      mkImportant: "Important",
      mkRemember: "Remember",
      mkWarning: "Warning",
      mkExample: "Example",
      mkGoodPractice: "Good Practice",
      dgEnterMarkContent: "Enter {v0} content...",
      dgCustomFieldDefault: "Custom Field:",
      dgTeamName: "Name",
      dgTeamTask: "Task",
      dgTeamLocation: "Work Location",
      dgConfirmDeletionthisWillPermanently9: "⚠️ Confirm Deletion\n\nThis will permanently remove this team member from the list.\nThis action cannot be undone.\n\nContinue?",
      dgConfirmClearLastTeamMember: "⚠️ Confirm Clear\n\nThis will clear this member's details in both languages.\nThe row stays, empty and ready for a new entry.\n\nContinue?",
      dlgOk: "OK",
      dlgCancel: "Cancel",
      dlgConfirm: "Confirm",
      dlgDelete: "Delete",
      dlgSave: "Save",
    },

    /* French is declared and empty. Keeping the slot present means the
       selector, the RTL test and the fallback chain are all exercised by
       a third locale from day one, so adding French later is a data task
       rather than a code task. Missing keys fall back to English. */
    fr: {},

    ar: {
      mbModuleBuilderV20: "باني الوحدات التدريبية — الإصدار 2.0",
      mbACompetencyBasedTrainingModuleDevelopm: "أداة لتطوير وحدات تدريبية قائمة على الكفاءة، لبناء محصلات التعلم والأنشطة والتقييم.",
      mbBasicInfo: "🏠 المعلومات الأساسية",
      mbCovers: "الأغلفة",
      mbIntroductionPages: "صفحات التقديم",
      mbInformationSheet: "ورقة المعلومات",
      mbActivityJobSheet: "ورقة النشاط/العمل",
      mbAssessmentUnit: "وحدة التقييم",
      mbReferences: "📚 المراجع",
      mbHelp: "❓ المساعدة",
      mbClearImportedStructureStartManualAutho: "🧹 مسح الهيكل المستورد والبدء بالتأليف اليدوي",
      mbModuleManagement: "📦 إدارة الوحدات",
      mbAddModule: "➕ إضافة وحدة",
      mbCurrentModule: "الوحدة الحالية:",
      mbSelectModule: "— اختر وحدة —",
      mbRename: "✏️ إعادة تسمية",
      mbDelete: "🗑️ حذف",
      mbLearningOutcomes: "📚 محصلات التعلم:",
      mbTotalSheets: "📄 مجموع الأوراق:",
      mbLearningOutcomeManagement: "📚 إدارة محصلات التعلم",
      mbAddLearningOutcome: "➕ إضافة محصلة تعلم",
      mbCurrentLearningOutcome: "محصلة التعلم الحالية:",
      mbSelectLearningOutcome: "— اختر محصلة تعلم —",
      mbModule: "📦 الوحدة:",
      mbInformationSheets: "📄 أوراق المعلومات:",
      mbActivitySheets: "⚡ أوراق النشاط:",
      mbAddCriterion: "➕ إضافة معيار",
      mbNoPerformanceCriteriaAvailable: "لا توجد معايير أداء",
      mbFrontCover: "🖼️ الغلاف الأمامي",
      mbOptionalExportedAsTheVeryFirst: "(اختياري — يُصدَّر بوصفه الصفحة الأولى)",
      mbTip: "إرشاد:",
      mbA4SizedImage210297Mm: "صورة بقياس A4 (210 × 297 ملم)",
      mb24803508Px: "2480 × 3508 بكسل",
      mb12401754Px: "1240 × 1754 بكسل",
      mbClickOrDragDropToUpload: "انقر أو اسحب وأفلت لرفع صورة الغلاف الأمامي",
      mbPngJpgWebpWillBeStretched: "PNG أو JPG أو WEBP — ستُمدَّد لملء صفحة A4 كاملة (210 × 297 ملم)",
      mbImageLoadedWillBeTheFirst: "✓ تم تحميل الصورة — ستكون الصفحة الأولى عند التصدير. انقر للاستبدال.",
      mbRemoveFrontCoverImage: "🗑️ إزالة صورة الغلاف الأمامي",
      mbCoverPageInformation: "📋 معلومات صفحة الغلاف",
      mbAdditionalInformationOptional: "معلومات إضافية (اختياري)",
      mbProjectNameInstitutionEtc: "اسم المشروع، الجهة، إلخ.",
      mbEnterAnyAdditionalInformationEG: "أدخل أي معلومات إضافية (مثل اسم المشروع أو اسم الجهة)",
      mbModuleInformationTable: "جدول معلومات الوحدة",
      mbAddCustomRow: "➕ إضافة صف مخصص",
      mbFillInTheModuleDetailsBelow: "املأ تفاصيل الوحدة أدناه. انقر «إعادة تسمية» لتخصيص عناوين الحقول.",
      mbTableRowsWillBeAddedHere: "ستُضاف صفوف الجدول هنا تلقائياً",
      mbAdditionalNotesOptional: "ملاحظات إضافية (اختياري)",
      mbExtraInformationAfterTheTable: "معلومات إضافية بعد الجدول",
      mbEnterAnyAdditionalNotesToAppear: "أدخل أي ملاحظات إضافية تظهر بعد جدول معلومات الوحدة",
      mbBackCover: "🖼️ الغلاف الخلفي",
      mbOptionalExportedAsTheLastPage: "(اختياري — يُصدَّر بوصفه الصفحة الأخيرة)",
      mbClickOrDragDropToUpload2: "انقر أو اسحب وأفلت لرفع صورة الغلاف الخلفي",
      mbImageLoadedWillFillFullA4: "✓ تم تحميل الصورة — ستملأ صفحة A4 كاملة عند التصدير. انقر للاستبدال.",
      mbRemoveBackCoverImage: "🗑️ إزالة صورة الغلاف الخلفي",
      mbProceedToIntroductionPages: "المتابعة إلى صفحات التقديم ←",
      mbIntroductionPages2: "📄 صفحات التقديم",
      mbWorkTeam: "فريق العمل",
      mbAddTeamMember: "➕ إضافة عضو",
      mbAddTeamMembersWhoWorkedOn: "أضف أعضاء الفريق الذين عملوا على هذه الوحدة. سيظهرون في صفحة مستقلة.",
      mbTeamMembersWillBeAddedHere: "سيُضاف أعضاء الفريق هنا تلقائياً",
      mbAdditionalIntroductionDetailsOptional: "تفاصيل تقديمية إضافية (اختياري)",
      mbStartsOnNewPageIfFilled: "تبدأ في صفحة جديدة إذا مُلئت",
      mbExtraIntroductionSections: "أقسام تقديمية إضافية (اختياري)",
      mbEachSectionStartsOnNewPage: "يبدأ كل قسم في صفحة جديدة — والأقسام الفارغة لا تُصدَّر",
      mbAddIntroductionSection: "➕ إضافة قسم تقديمي",
      mbModuleContents: "محتويات الوحدة التدريبية",
      mbLearningOutcomeSections: "أقسام محصلة التعلم (اختياري)",
      mbEmptySectionsNotExported: "الأقسام الفارغة لا تُصدَّر",
      mbAddSection: "➕ إضافة قسم",
      mbSectionTitlePlaceholder: "عنوان القسم — يظهر عنواناً في الملف المصدَّر",
      mbSectionBodyPlaceholder: "اتركه فارغاً ليبقى هذا القسم خارج الملف المصدَّر…",
      mbRemoveSection: "حذف القسم",
      dgImageOptimized: "حُسِّنت الصورة: {v0} ← {v1}",
      dgSectionAdded: "أُضيف القسم",
      dgSectionDeleted: "حُذف القسم",
      dgConfirmDeleteSection: "حذف هذا القسم؟\n\nسيُفقد عنوانه ونصّه. هل تريد المتابعة؟",
      mbEnterAnyAdditionalIntroductionContentA: "أدخل أي محتوى تقديمي إضافي (شكر وتقدير، تمهيد، إلخ.)",
      mbProceedToInformationSheet: "المتابعة إلى ورقة المعلومات ←",
      mbLearningOutcome: "📚 محصلة التعلم:",
      mbRemoveSheet: "🗑️ إزالة الورقة",
      mbPreviousInfoSheet: "ورقة المعلومات السابقة",
      mbSheet1Of1: "الورقة 1 من 1",
      mbNextInfoSheet: "ورقة المعلومات التالية",
      mbAddInfoSheet: "➕ إضافة ورقة معلومات",
      mbInformationSheetTitle: "عنوان ورقة المعلومات:",
      mbEnterInformationSheetTitle: "أدخل عنوان ورقة المعلومات…",
      mbObjective: "الهدف:",
      mbNumber: "🔢 ترقيم",
      mbConvertToNumberedList: "تحويل إلى قائمة مرقّمة",
      mbBullet: "• تعداد",
      mbConvertToBulletedList: "تحويل إلى قائمة نقطية",
      mbClear: "✖ مسح",
      mbClearFormatting: "مسح التنسيق",
      mbEnterTheLearningObjective: "أدخل هدف التعلم…",
      mbContent: "المحتوى:",
      mbQrCodeLink: "رمز الاستجابة والرابط:",
      mbVideoResourceSubject: "موضوع الفيديو/المصدر:",
      mbEGPaintlessDentRemovalTutorial: "مثال: شرح إزالة الانبعاج دون طلاء",
      mbVideoResourceLink: "رابط الفيديو/المصدر:",
      mbQrCodeImage: "صورة رمز الاستجابة:",
      mbUploadQrCode25cmX: "🖼️ رفع رمز الاستجابة (2.5 × 2.5 سم)",
      mbSelfCheck: "التقويم الذاتي:",
      mbNumberedList: "قائمة مرقّمة",
      mbBulletList: "قائمة نقطية",
      mbRemoveNumberingBullets: "إزالة الترقيم/التعداد",
      mbClearAllNumberContent: "مسح الكل (الرقم والمحتوى)",
      mbEnterSelfCheckQuestionsAndContent: "أدخل أسئلة التقويم الذاتي ومحتواه…",
      mbAnswersKey: "مفتاح الإجابات:",
      mbEnterAnswersKeyContent: "أدخل محتوى مفتاح الإجابات…",
      mbProceedToActivityJobSheet: "المتابعة إلى ورقة النشاط/العمل ←",
      mbPreviousActivitySheet: "ورقة النشاط السابقة",
      mbNextActivitySheet: "ورقة النشاط التالية",
      mbAddActivitySheet: "➕ إضافة ورقة نشاط",
      mbActivitySheetTitle: "عنوان ورقة النشاط:",
      mbEnterActivitySheetTitle: "أدخل عنوان ورقة النشاط…",
      mbEnterTheLearningObjectiveForThis: "أدخل هدف التعلم لهذا النشاط…",
      mbDurationMinutes: "المدة (بالدقائق):",
      mbExample45Minutes: "مثال: 45 دقيقة",
      mbTrainingResources: "المصادر التدريبية:",
      mbMaterialEquipment: "المادة / التجهيزات",
      mbQuantityNumber: "الكمية / العدد",
      mbAddRow: "➕ إضافة صف",
      mbClearRows: "🗑️ مسح الصفوف",
      mbActivitySteps: "خطوات النشاط:",
      mbPerformanceCriteriaCheckList: "قائمة تدقيق معايير الأداء:",
      mbPerformanceCriteriaCheckList11: "قائمة تدقيق معايير الأداء/ 1-1",
      mbBeforeYouTellTheTrainerTo: "قبل أن تُعلم المدرّب بإتمامك النشاط… قوّم نفسك بالإجابة عن الأسئلة الآتية:",
      mbDidYou: "هل قمت بـ…",
      mbThePerformanceLevelAnswerForAll: "ينبغي أن تكون الإجابة عن جميع البنود (نعم). وإذا كانت الإجابة (لا)، فيُعاد تدريب المهارة حتى إتقانها.",
      mbProceedToAssessmentUnit: "المتابعة إلى وحدة التقييم ←",
      mbAssessmentUnit2: "📋 وحدة التقييم",
      mbAssessmentContent: "محتوى التقييم",
      mbInstructionsCriteriaGuidelines: "التعليمات والمعايير والإرشادات",
      mbEnterAssessmentContentInstructionsAndC: "أدخل محتوى التقييم وتعليماته ومعاييره هنا…",
      mbAssessmentFormsPerLearningOutcome: "استمارات التقييم لكل محصلة تعلم",
      mbAddAssessmentForm: "➕ إضافة استمارة تقييم",
      mbRenameSectionHeading: "إعادة تسمية عنوان القسم",
      mbEGSmithJ2020Vocational: "مثال: الجواد، حسام (2020). دليل التدريب المهني. الناشر.",
      mbAddReference: "➕ إضافة مرجع",
      mbHelpCenter: "مركز المساعدة",
      mbEverythingYouNeedToUseModule: "كل ما تحتاجه لاستخدام باني الوحدات بكفاءة",
      mbQuickStartHowToUseModule: "البدء السريع: كيف تستخدم باني الوحدات",
      mbBasicInfo2: "المعلومات الأساسية",
      mbActivityJobSheet2: "ورقة النشاط/العمل",
      mbReferences2: "المراجع",
      mbSaveWork: "💾 حفظ العمل",
      mbLoadWork: "تحميل عمل محفوظ",
      mbExportToWord: "📄 تصدير إلى Word",
      mbUserGuide: "دليل المستخدم",
      mbAccessTheFullDocumentationForModule: "اطّلع على التوثيق الكامل لباني الوحدات — ويتضمن تعليمات تفصيلية ولقطات شاشة وأفضل الممارسات.",
      mbOpenUserGuide: "📖 فتح دليل المستخدم",
      mbDownloadPdf: "⬇️ تنزيل PDF",
      mbScanToOpenTheUserGuide: "امسح الرمز لفتح دليل المستخدم على جهازك المحمول.",
      mbAboutTheCreator: "عن المطوّر",
      mbCreatorOfModuleBuilder: "مطوّر باني الوحدات التدريبية",
      mbTvetCurriculumDeveloperEducationalTech: "خبير تطوير مناهج التعليم والتدريب المهني ومبتكر في تقنيات التعليم",
      mbEmail: "البريد الإلكتروني",
      mbLinkedin: "لينكدإن",
      mbGetInTouch: "للتواصل",
      mbForQuestionsFeedbackSuggestionsOrColla: "للأسئلة أو الملاحظات أو المقترحات أو فرص التعاون، يرجى التواصل عبر معلومات الاتصال أعلاه.",
      mb2026ModuleBuilderByHushamJawad: "© 2026 باني الوحدات التدريبية | إعداد حسام جواد كاظم | الإصدار 2.0 | جميع الحقوق محفوظة",
      mbDisclaimer: "إخلاء مسؤولية:",

      /* Used by the engine itself, not by any element in the markup. */
      dgLangLocked: "تعذّر تبديل اللغة أثناء تنفيذ عملية جارية.",
      dgNoLearningOutcomesAvailablePlease: "لا توجد محصلات تعلم. أضف محصلة تعلم أولاً.",
      dgAllLearningOutcomesAlreadyHave: "جميع محصلات التعلم لديها استمارات تقييم بالفعل.",
      dgNoAssessmentFormsYet: "لم يتم إنشاء أي استمارة تقييم بعد. اضغط «إضافة استمارة تقييم» لإنشائها.",
      dgClearImportedStartManual: "\u26a0\ufe0f مسح البنية المستوردة والبدء بالتأليف اليدوي؟\n\nسيؤدي هذا إلى:\n\u2022 مسح جميع الوحدات ومحصلات التعلم ومعايير الأداء المستوردة\n\u2022 التحويل إلى وضع التأليف اليدوي\n\u2022 يمكنك بعدها إنشاء وحداتك من البداية\n\nلا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟",
      dgClearAllDataInThis: "مسح جميع بيانات استمارة التقييم هذه (الصفوف والنتائج والتواقيع)؟",
      dgDeleteThisAssessmentFormCompletely: "حذف استمارة التقييم هذه نهائياً؟ لن تُحذف محصلة التعلم.",
      dgCannotDeleteTheLastRow: "لا يمكن حذف الصف الأخير. استخدم «مسح جميع الصفوف» بدلاً من ذلك.",
      dgAreYouSureYouWant: "هل تريد بالتأكيد مسح جميع الصفوف لمحصلة التعلم هذه؟",
      dgConfirmDeletionthisWillPermanently: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى حذف قسم المحتوى هذا وصوره نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgConfirmDeletionthisWillPermanently2: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى مسح كل محتوى ورقة المعلومات نهائياً، ويشمل:\n• العنوان والهدف\n• أقسام المحتوى وصورها\n• التقويم الذاتي ومفتاح الإجابات\n\nهل تريد المتابعة؟",
      dgInformationSheetCleared: "تم مسح ورقة المعلومات!",
      dgEnterNewLabelName: "أدخل اسم العنوان الجديد:",
      dgConfirmDeletionthisWillPermanently3: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى حذف صف جدول الغلاف هذا نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgEnterLabelForNewRow: "أدخل عنوان الصف الجديد:",
      dgConfirmDeletionthisWillPermanently4: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى حذف معيار التقييم هذا نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgDocumentLibraryIsStillLoading: "مكتبة المستندات قيد التحميل. انتظر لحظة ثم أعد المحاولة.",
      dgPleaseFillInAtLeast: "املأ تبويباً واحداً على الأقل قبل التصدير!",
      dgExportInProgressProcessingContent: "⏳ جارٍ التصدير… معالجة المحتوى والصور…",
      dgDocumentExportedSuccessfullyFileMb: "✅ تم تصدير المستند بنجاح! الملف: {v0} ({v1} ميغابايت)",
      dgExportFailed: "❌ فشل التصدير: ",
      dgRemoveThisMarkThisAction: "إزالة هذه العلامة؟\nلا يمكن التراجع عن هذا الإجراء.",
      dgImportedModulesWithLearningOutcome: "تم استيراد {v0} وحدة تتضمن {v1} محصلة تعلم من DACUM Live Pro!",
      dgSwitchedTo: "تم التبديل إلى {v0}",
      dgSwitchedTo2: "تم التبديل إلى {v0}",
      dgEnterModuleTitle: "أدخل عنوان الوحدة:",
      dgModuleAddedYouCanNow: "أُضيفت الوحدة! يمكنك الآن إضافة محصلات التعلم إليها.",
      dgPleaseSelectAModuleFirst: "اختر وحدة أولاً!",
      dgEnterNewModuleTitle: "أدخل عنوان الوحدة الجديد:",
      dgModuleRenamed: "أُعيدت تسمية الوحدة!",
      dgModuleDeleted: "حُذفت الوحدة!",
      dgPleaseSelectOrCreateA: "اختر وحدة أو أنشئ واحدة أولاً!",
      dgEnterLearningOutcomeTitle: "أدخل عنوان محصلة التعلم:",
      dgLearningOutcomeAdded: "أُضيفت محصلة التعلم!",
      dgPleaseSelectALearningOutcome: "اختر محصلة تعلم أولاً!",
      dgEnterPerformanceCriterion: "أدخل معيار الأداء:",
      dgPerformanceCriterionAdded: "أُضيف معيار الأداء!",
      dgEditPerformanceCriterion: "تعديل معيار الأداء:",
      dgPerformanceCriterionCannotBeEmpty: "لا يمكن أن يكون معيار الأداء فارغاً!",
      dgPerformanceCriterionUpdated: "حُدّث معيار الأداء!",
      dgConfirmDeletionthisWillPermanently5: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى حذف معيار الأداء هذا نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgPerformanceCriterionDeleted: "حُذف معيار الأداء!",
      dgSwitchedToManualAuthoringMode: "تم التبديل إلى وضع التأليف اليدوي! أنشئ وحداتك ومحصلات التعلم.",
      dgEnterNewTitle: "أدخل العنوان الجديد:",
      dgLearningOutcomeRenamed: "أُعيدت تسمية محصلة التعلم!",
      dgLearningOutcomeDeleted: "حُذفت محصلة التعلم!",
      dgEnterNewSectionTitle: "أدخل عنوان القسم الجديد:",
      dgClearAllResourceRows: "مسح جميع صفوف المصادر؟",
      dgInfoSheetAdded: "أُضيفت ورقة المعلومات {v0}!",
      dgNoInfoSheetToRemove: "لا توجد ورقة معلومات لإزالتها.",
      dgConfirmDeletionthisWillPermanently6: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى إزالة ورقة المعلومات {v0} نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgInfoSheetRemoved: "أُزيلت ورقة المعلومات!",
      dgActivitySheetAdded: "أُضيفت ورقة النشاط {v0}!",
      dgNoActivitySheetToRemove: "لا توجد ورقة نشاط لإزالتها.",
      dgConfirmDeletionthisWillPermanently7: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى إزالة ورقة النشاط {v0} نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgActivitySheetRemoved: "أُزيلت ورقة النشاط!",
      dgConfirmDeletionthisWillPermanently8: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى إزالة هذه الخطوة وصورها نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgAreYouSureYouWant2: "هل تريد بالتأكيد مسح ورقة النشاط هذه؟",
      dgActivitySheetCleared: "تم مسح ورقة النشاط!",
      dgWorkSavedSuccessfully: "تم حفظ العمل بنجاح! ✓",
      dgErrorSavingWork: "خطأ في حفظ العمل: ",
      dgWorkLoadedSuccessfully: "تم تحميل العمل بنجاح!",
      dgWorkLoadedSuccessfullyConvertedFro: "تم تحميل العمل بنجاح! (محوَّل من الإصدار 2.0)",
      dgOldFormatImportedSuccessfully: "تم استيراد التنسيق القديم بنجاح!",
      dgErrorLoadingWork: "خطأ في تحميل العمل: ",
      dgConfirmClearAllDatathisWill: "⚠️ تأكيد مسح جميع البيانات\n\nسيؤدي هذا إلى الحذف النهائي لـ:\n• جميع الوحدات ومحصلات التعلم\n• جميع أوراق المعلومات والنشاط\n• جميع الأغلفة وبيانات فريق العمل\n\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgAllDataCleared: "مُسحت جميع البيانات!",
      dgPleaseSelectALearningOutcome2: "📚 اختر محصلة تعلم قبل المتابعة.\n\nيمكنك اختيار محصلة تعلم أو إنشاؤها في تبويب «المعلومات الأساسية».",
      dgWarningDocxLibraryFailedTo: "⚠️ تنبيه: تعذّر تحميل مكتبة DOCX. قد لا يعمل التصدير. تحقّق من اتصالك بالإنترنت.",
      dgDismiss: "إخفاء",
      dgAddRow: "إضافة صف",
      dgAddColumn: "إضافة عمود",
      dgDeleteLastRow: "حذف الصف الأخير",
      dgDeleteLastColumn: "حذف العمود الأخير",
      dgRemoveTable: "إزالة الجدول",
      dgClearContent: "مسح المحتوى",
      dgRemoveContent: "إزالة المحتوى",
      dgEnterContent: "أدخل المحتوى…",
      dgAddTable: "إضافة جدول",
      dgRemoveImage: "إزالة الصورة",
      dgEnterValue: "أدخل القيمة…",
      dgEnterCriterion: "أدخل المعيار…",
      dgRemoveMark: "إزالة العلامة",
      dgMaterialOrEquipmentName: "اسم المادة أو التجهيزات…",
      dgRemoveRow: "إزالة الصف",
      dgClearStep: "مسح الخطوة",
      dgRemoveStep: "إزالة الخطوة",
      dgDescribeThisStep: "اوصف هذه الخطوة…",
      dgNoTeamMembersYet: "لم يُضَف أعضاء بعد. انقر «إضافة عضو» للبدء.",
      tiConvertToNumberedList: "تحويل إلى قائمة مرقّمة",
      tiConvertToBulletedList: "تحويل إلى قائمة نقطية",
      tiClearFormatting: "مسح التنسيق",
      phHttps: "https://…",
      tiNumberedList: "قائمة مرقّمة",
      tiBulletList: "قائمة نقطية",
      tiRemoveNumberingBullets: "إزالة الترقيم/التعداد",
      tiRenameSectionHeading: "إعادة تسمية عنوان القسم",
      mbContentLanguage: "لغة المحتوى",
      mbQrCode: "رمز الاستجابة",
      mbUnavailable: "غير متاح",
      tiConvertToNumberedList: "تحويل إلى قائمة مرقّمة",
      tiConvertToBulletedList: "تحويل إلى قائمة نقطية",
      tiClearFormatting: "مسح التنسيق",
      phHttps: "https://…",
      tiNumberedList: "قائمة مرقّمة",
      tiBulletList: "قائمة نقطية",
      tiRemoveNumberingBullets: "إزالة الترقيم/التعداد",
      tiRenameSectionHeading: "إعادة تسمية عنوان القسم",
      txModuleBuilderV20: "باني الوحدات التدريبية — الإصدار 2.0",
      txSaveWork: "حفظ العمل",
      txLoadWork: "تحميل عمل",
      txExportToWord: "تصدير إلى Word",
      txClearAll: "مسح الكل",
      txPerformanceCriteriaForThisLearning: "معايير الأداء لمحصلة التعلم هذه",
      txUploadAn: "ارفع",
      txForBestResults: "للحصول على أفضل نتيجة.",
      txRecommended: "المُوصى به:",
      txAt300DpiOr: "بدقة 300 نقطة/بوصة — أو",
      txAt150Dpi: "بدقة 150 نقطة/بوصة.",
      txSmallerImagesWillBeAutomaticallySt: "ستُمدَّد الصور الأصغر تلقائياً لملء صفحة A4 كاملة.",
      txNo: "الرقم:",
      txYes: "نعم",
      txNo2: "لا",
      txCreateYourModuleAddLearningOutcome: "— أنشئ وحدتك، وأضف محصلات التعلم، واضبط تفاصيل الوحدة.",
      txUploadAFrontCoverImageFill: "— ارفع صورة الغلاف الأمامي، واملأ جدول معلومات الوحدة، والملاحظات الاختيارية.",
      txAddYourWorkTeamMembersAnd: "— أضف أعضاء فريق العمل وأي نص تقديمي.",
      txSelectAModuleAndLearningOutcome: "— اختر وحدة ومحصلة تعلم، ثم أضف أوراق معلومات بمحتواها وصورها والتقويم الذاتي.",
      txSelectAModuleAndLearningOutcome2: "— اختر وحدة ومحصلة تعلم، ثم أضف أوراق نشاط بخطواتها ومصادرها ومعايير الأداء.",
      txSelectAModuleAndAddAssessment: "— اختر وحدة وأضف استمارات تقييم بمعاييرها والتحقق منها والتواقيع.",
      txAddYourBibliographyEntriesTheseWil: "— أضف مداخل المراجع. ستظهر بوصفها آخر صفحة محتوى قبل الغلاف الخلفي.",
      txSaveYourProgressToAJson: "— احفظ عملك في ملف JSON في أي وقت. استخدم",
      txToRestoreItLater: "لاستعادته لاحقاً.",
      txWhenReadyExportTheCompleteModule: "— عند الجاهزية، صدّر الوحدة كاملة ملفَّ DOCX منسَّقاً.",
      txQrCode: "رمز الاستجابة",
      txUnavailable: "غير متاح",
      txModuleBuilderIsProvidedAsIs: "تُقدَّم أداة باني الوحدات التدريبية «كما هي» دون أي ضمان. لا يتحمل المطوّر مسؤولية أي فقدان للبيانات أو أضرار ناتجة عن استعمالها. احفظ عملك بانتظام.",
      dgAddContent: "إضافة محتوى",
      dgAddTableBtn: "إضافة جدول",
      dgAddRowBtn: "إضافة صف",
      dgDeleteForm: "حذف الاستمارة",
      dgSignatures: "التواقيع",
      dgTrainerSignature: "توقيع المدرّب",
      dgLearnerSignature: "توقيع المتدرّب",
      dgTrainerDate: "تاريخ المدرّب",
      dgLearnerDate: "تاريخ المتدرّب",
      dgSignaturesManual: "تُملأ التواقيع يدوياً على الاستمارة المطبوعة.",
      dgNoCriteriaAvailable: "لا توجد معايير أداء. انقر «إضافة معيار» لإضافة واحد.",
      expResultPlain: "النتيجة",
      cvSector: "القطاع:",
      cvOccupation: "المهنة:",
      cvJob: "الوظيفة:",
      cvQualification: "المؤهل:",
      cvModuleCode: "رمز الوحدة وعنوانها:",
      cvLevel: "المستوى:",
      cvVersion: "الإصدار:",
      asRestored: "استُعيدت الجلسة السابقة",
      asBackupReminder: "لا تنسَ حفظ عملك (نسخة احتياطية)",
      asSaveNow: "احفظ الآن",
      rxClearForm: "مسح الاستمارة",
      rxActions: "الإجراءات",
      rxClearRows: "مسح الصفوف",
      rxRow: "صف",
      rxCol: "عمود",
      rxRemove: "إزالة",
      rxAddImageS: "إضافة صور",
      rxRename: "إعادة تسمية",
      dgNoSheets: "لا توجد أوراق",
      dgDefaultLOName: "محصلة التعلم {v0}",
      dgDefaultModuleName: "الوحدة {v0}",
      dgSheetXOfY: "الورقة {v0} من {v1}",
      dgAddMark: "إضافة علامة",
      dgAddImages: "إضافة صور",
      dgAddStep: "إضافة خطوة",
      dgContentN: "المحتوى {v0}:",
      mbExportLanguage: "لغة التصدير",
      expObjective: "الهدف:",
      expDuration: "المدة: ",
      expMaterialEquipment: "المادة / التجهيزات",
      expQuantityNumber: "الكمية / العدد",
      expActivitySteps: "خطوات النشاط:",
      expWorkTeam: "فريق العمل",
      expName: "الاسم",
      expTask: "المهمة",
      expWorkLocation: "موقع العمل",
      expPerformanceCriteria: "معايير الأداء:",
      expTrainingResources: "المصادر التدريبية:",
      expAssessmentUnitCaps: "وحدة التقييم",
      expAssessmentUnit: "وحدة التقييم",
      expPortfolioOfEvidence: "حافظة الأدلة",
      expResult: "النتيجة:",
      expWatchVideo: "شاهد الفيديو…",
      expMinutes: "{v0} دقيقة",
      expDidYou: "هل قمت بـ…",
      expYes: "نعم",
      expNo: "لا",
      expAssessmentCriteria: "معايير التقييم",
      expNameNumberActivities: "اسم أنشطة التعلم وعددها",
      expOutcomesMethod: "المحصلات أو أسلوب التقييم",
      expEvidenceVerification: "التحقق من الأدلة",
      expCompletionDateNotes: "تاريخ الإنجاز أو الملاحظات",
      expReferences: "المراجع",
      expActivitySheetTitled: "ورقة النشاط/العمل {v0} \\ {v1}",
      expActivitySheetUntitled: "ورقة النشاط/العمل \\ {v0}",
      expInfoSheetTitled: "ورقة المعلومات {v0} \\ {v1}",
      expSelfCheck: "التقويم الذاتي \\ {v0}",
      expAnswersKey: "مفتاح الإجابات \\ {v0}",
      expStepN: "الخطوة {v0}:",
      expCriteriaCheckList: "قائمة تدقيق معايير الأداء/ {v0}",
      expLearningOutcomeN: "محصلة التعلم {v0}: {v1}",
      expCompetent: "كفؤ",
      expNotYetCompetent: "غير كفؤ بعد",
      expTrainerName: "اسم المدرّب",
      expLearnerName: "اسم المتدرّب",
      expSignatureLine: "{v0}: {v1}     التوقيع: {v2}     التاريخ: {v3}",
      expCriteriaInstructionDefault: "قبل أن تُعلم المدرّب بإتمامك النشاط… قوّم نفسك بالإجابة عن الأسئلة الآتية:",
      expCriteriaFooterDefault: "ينبغي أن تكون الإجابة عن جميع البنود (نعم). وإذا كانت الإجابة (لا)، فيُعاد تدريب المهارة حتى إتقانها.",
      mkAttention: "انتبه",
      mkReview: "مراجعة",
      mkQuestion: "سؤال",
      mkReflect: "تأمّل",
      mkNote: "ملاحظة",
      mkTip: "إرشاد",
      mkImportant: "مهم",
      mkRemember: "تذكّر",
      mkWarning: "تحذير",
      mkExample: "مثال",
      mkGoodPractice: "ممارسة جيدة",
      dgEnterMarkContent: "أدخل محتوى {v0}…",
      dgCustomFieldDefault: "حقل مخصص:",
      dgTeamName: "الاسم",
      dgTeamTask: "المهمة",
      dgTeamLocation: "موقع العمل",
      dgConfirmDeletionthisWillPermanently9: "⚠️ تأكيد الحذف\n\nسيؤدي هذا إلى إزالة عضو الفريق هذا من القائمة نهائياً.\nلا يمكن التراجع عن هذا الإجراء.\n\nهل تريد المتابعة؟",
      dgConfirmClearLastTeamMember: "⚠️ تأكيد المسح\n\nسيؤدي هذا إلى مسح بيانات هذا العضو في اللغتين.\nيبقى الصف فارغاً جاهزاً لإدخال جديد.\n\nهل تريد المتابعة؟",
      dlgOk: "حسناً",
      dlgCancel: "إلغاء",
      dlgConfirm: "تأكيد",
      dlgDelete: "حذف",
      dlgSave: "حفظ",
    },
  };

  var _current = (typeof mbGetSetting === 'function' ? mbGetSetting(MB_KEYS.uiLang) : null) || 'en';

  function t(key) {
    var lang = TRANSLATIONS[_current] || TRANSLATIONS.en;
    if (lang[key] !== undefined)            return lang[key];
    if (TRANSLATIONS.en[key] !== undefined) return TRANSLATIONS.en[key];
    return key;
  }

  function tf(key, vars) {
    var s = t(key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
      });
    }
    return s;
  }


  /* ── Stale-text audit ────────────────────────────────────────────
     Catches a whole class of bug that neither applyTranslations() nor a
     re-render can fix: an element created once and thereafter only
     shown/hidden. It has no data-i18n (it was never in index.html) and
     it is never rebuilt, so its label freezes in whichever language was
     active when it was first created — the "Add Duty" button that stayed
     Arabic after switching to French.

     The audit walks visible text and flags any string that exactly
     matches a translation value belonging to a DIFFERENT locale. False
     positives are possible (a user could name a duty "Add Duty"), which
     is why this only ever warns and never mutates anything.

     Off by default. Enable with:
       localStorage.setItem('mb_i18n_debug', '1')
     or call window.i18n.audit() from the console at any time. */
  function audit() {
    var foreign = {};
    for (var code in TRANSLATIONS) {
      if (code === _current) continue;
      for (var key in TRANSLATIONS[code]) {
        var val = TRANSLATIONS[code][key];
        // Only flag strings the CURRENT locale translates differently —
        // "PDF" or "Word" are identical everywhere and are not evidence
        // of staleness.
        if (typeof val === 'string' && val.length > 2 &&
            TRANSLATIONS[_current][key] !== undefined &&
            TRANSLATIONS[_current][key] !== val) {
          foreign[val] = { key: key, lang: code };
        }
      }
    }

    var hits = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var txt = (node.nodeValue || '').trim();
      if (!txt || !foreign[txt]) continue;
      var el = node.parentElement;
      // Anything the user typed is their content, not our stale output.
      if (!el || el.isContentEditable) continue;
      hits.push({
        text: txt,
        expected: TRANSLATIONS[_current][foreign[txt].key],
        key: foreign[txt].key,
        stuckIn: foreign[txt].lang,
        element: el
      });
    }

    if (hits.length) {
      console.warn('[i18n] ' + hits.length +
        ' element(s) still showing another language after switching to ' +
        _current + ':', hits);
    } else {
      console.info('[i18n] audit clean for ' + _current);
    }
    return hits;
  }


  /* ── AI output-language directive ────────────────────────────────
     Appended to every prompt sent to the generation backend, at the
     single point where each AI module builds its request. Doing it
     there rather than inside each prompt string means a prompt added
     later is covered automatically and cannot be forgotten.

     Two things are specified, and the second matters more than the
     first: the OUTPUT LANGUAGE, and the DACUM TERMINOLOGY to use in
     that language. Without the glossary a model will happily produce
     fluent Arabic that calls a Duty a «مهمة رئيسية» in one cluster and
     «مجال عمل» in the next — internally inconsistent, and at odds with
     the interface labels sitting right beside it on screen.

     English returns an empty string: the prompts are written in English
     and adding "reply in English" is noise that costs tokens and can
     distract a model from the actual instruction. */
  var AI_DIRECTIVE = {
    ar: '\n\n=== OUTPUT LANGUAGE ===\n' +
        'Write ALL generated content in Modern Standard Arabic (\u0627\u0644\u0639\u0631\u0628\u064a\u0629 \u0627\u0644\u0641\u0635\u062d\u0649).\n' +
        'JSON keys, field names and any id values stay exactly as specified in English — ' +
        'translate only the human-readable VALUES.\n' +
        'Use this DACUM terminology consistently:\n' +
        '  Duty = \u0648\u0627\u062c\u0628\n' +
        '  Task = \u0645\u0647\u0645\u0629\n' +
        '  Competency Cluster = \u062a\u062c\u0645\u0639 \u0643\u0641\u0627\u0621\u0627\u062a\n' +
        '  Performance Criteria = \u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0623\u062f\u0627\u0621\n' +
        '  Range = \u0627\u0644\u0645\u062f\u0649\n' +
        '  Learning Outcome = \u0645\u062d\u0635\u0644\u0629 \u062a\u0639\u0644\u0645\n' +
        '  Module = \u0648\u062d\u062f\u0629 \u062a\u0639\u0644\u0645\u064a\u0629\n' +
        '  Facilitator = \u0645\u064a\u0633\u0631\n' +
        'Keep "DACUM" in Latin script, untranslated.\n' +
        'Task and duty statements start with a verbal noun (\u0645\u0635\u062f\u0631), e.g. ' +
        '\u00ab\u0645\u0639\u0627\u064a\u0631\u0629 \u0645\u0642\u064a\u0627\u0633 \u0645\u062a\u0639\u062f\u062f \u0631\u0642\u0645\u064a\u00bb — not a conjugated verb.\n' +
        'Keep technical abbreviations, standards codes, tool model numbers and ' +
        'measurements in their original Latin form (CNC, PLC, ISO 9001, \u00b10.5 mm).',

    fr: '\n\n=== OUTPUT LANGUAGE ===\n' +
        'Write ALL generated content in French.\n' +
        'JSON keys, field names and any id values stay exactly as specified in English — ' +
        'translate only the human-readable VALUES.\n' +
        'Use this DACUM terminology consistently:\n' +
        '  Duty = activit\u00e9\n' +
        '  Task = t\u00e2che\n' +
        '  Competency Cluster = grappe de comp\u00e9tences\n' +
        '  Performance Criteria = crit\u00e8res de performance\n' +
        '  Range = champ d\u2019application\n' +
        '  Learning Outcome = r\u00e9sultat d\u2019apprentissage\n' +
        '  Module = module\n' +
        '  Facilitator = animateur\n' +
        'Keep "DACUM" untranslated.\n' +
        'Task statements start with an infinitive verb.\n' +
        'Keep technical abbreviations, standards codes and measurements in their ' +
        'original form (CNC, PLC, ISO 9001, \u00b10,5 mm).',

    en: ''
  };

  function aiDirective() {
    return AI_DIRECTIVE[_current] || '';
  }


  /* ── Plural forms ────────────────────────────────────────────────
     English and French need two forms; Arabic needs six, and the rules
     are not a nicety — "1 duty / 2 duties" rendered as
     «1 واجب / 2 واجب» is simply wrong Arabic, and the sidebar shows
     these counts on every project card.

     CLDR categories for Arabic:
       0        → zero   لا يوجد واجب
       1        → one    واجب واحد
       2        → two    واجبان        (the dual — no European equivalent)
       3–10    → few    3 واجبات       (plural of paucity)
       11–99   → many   11 واجباً       (singular accusative!)
       100+     → other  100 واجب

     Keys are named "<base>_one", "<base>_two" and so on. A form that is
     missing falls back to "_other", so a language only has to define
     the categories it actually uses. */
  function _pluralCategory(n) {
    if (_current !== 'ar') return n === 1 ? 'one' : 'other';
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    var mod100 = n % 100;
    if (mod100 >= 3  && mod100 <= 10) return 'few';
    if (mod100 >= 11 && mod100 <= 99) return 'many';
    return 'other';
  }

  function tp(base, n, vars) {
    var cat  = _pluralCategory(n);
    var lang = TRANSLATIONS[_current] || TRANSLATIONS.en;
    var key  = base + '_' + cat;
    if (lang[key] === undefined) key = base + '_other';
    var merged = { n: n };
    if (vars) for (var k in vars) merged[k] = vars[k];
    return tf(key, merged);
  }

  /* Set by the Full Draft generator while a run is in flight. A run
     makes five or six model calls, each told to answer in whatever
     language was active when it started; switching halfway would leave
     the duties in Arabic and the modules in French, with no way to tell
     afterwards which half is which. Blocking the switch is cruder than
     re-translating, and far more honest than silently producing a
     mixed-language project. */
  var _langLocked = false;

  function lockLang(on)  { _langLocked = !!on; _syncSelector(); }
  function isLangLocked() { return _langLocked; }

  function setLang(code) {
    if (_langLocked) {
      /* Tell the user WHY rather than letting the click do nothing —
         a dead control reads as a bug. */
      if (window.showStatus) window.showStatus(t('dgLangLocked'), 'error');
      else console.warn('[i18n] ' + t('dgLangLocked'));
      return;
    }
    if (!TRANSLATIONS[code]) return;
    _current = code;
    if (typeof mbSetSetting === 'function') mbSetSetting(MB_KEYS.uiLang, code);
    applyTranslations();
  }

  function getLang() { return _current; }

  function _safeUpdate(el, val, attr) {
    /* data-i18n-attr accepts a COMMA-SEPARATED list, so one key can feed
       several attributes on the same element. Icon-only buttons need
       exactly this: the label has to reach BOTH title (the hover tooltip
       for mouse users) and aria-label (the only name a screen reader
       has, since there is no visible text). Before this, a value of
       "title,aria-label" was passed straight to setAttribute() as a
       single attribute name and threw InvalidCharacterError. */
    if (attr && attr !== 'text' && attr.indexOf(',') !== -1) {
      attr.split(',').forEach(function (one) {
        _safeUpdate(el, val, one.trim());
      });
      return;
    }

    if (attr === 'placeholder') { el.placeholder = val; return; }
    if (attr === 'title')       { el.title       = val; return; }
    if (attr && attr !== 'text') { el.setAttribute(attr, val); return; }

    /* data-i18n-once: the element is user-editable (the contenteditable
       section headings in Additional Info). Translate it only while it
       still holds a value this engine itself produced — the moment the
       facilitator renames a section, that name is THEIR content and a
       language switch must not overwrite it. We recognise our own output
       by checking the current text against every locale's value for the
       key, which is cheaper and more reliable than tracking an edit flag
       that a paste or an undo could desynchronise. */
    if (el.hasAttribute('data-i18n-once')) {
      var key = el.getAttribute('data-i18n');
      var cur = (el.textContent || '').trim();
      var mine = cur === '';
      for (var code in TRANSLATIONS) {
        if (TRANSLATIONS[code][key] === cur) { mine = true; break; }
      }
      if (!mine) return;
    }
    /* data-i18n-html: the VALUE itself contains markup — a <br> inside a
       table header, or a <strong> inside a sentence whose emphasis lands
       in a different position in each language. Such elements always have
       child nodes, so the guard below would skip them forever.

       Marking them explicitly (rather than sniffing for '<' in the value)
       keeps the dangerous path opt-in and greppable: only strings that
       come from this file's own dictionaries are ever written as HTML,
       never anything a user typed. */
    if (el.hasAttribute('data-i18n-html')) { el.innerHTML = val; return; }

    /* Otherwise: refuse to touch an element that wraps other elements.
       Writing textContent there would delete its children — which is how
       an icon-plus-label button loses its icon. Those elements keep the
       icon in the markup and put data-i18n on an inner <span>. */
    var hasChild = false;
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === Node.ELEMENT_NODE) { hasChild = true; break; }
    }
    if (!hasChild) el.textContent = val;
  }

  function applyTranslations() {
    /* document.title, not a data-i18n element: <title> uses the "text
       content" parsing model in HTML — it cannot have element children,
       so a <span data-i18n="..."> placed inside it never becomes a real
       DOM element at all. querySelectorAll would never find it, and
       browsers show whatever text sits there literally, tag markup and
       all. Set directly instead. */
    if (TRANSLATIONS[_current] && TRANSLATIONS[_current].txModuleBuilderV20) {
      document.title = t('txModuleBuilderV20');
    }
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      _safeUpdate(el, t(el.getAttribute('data-i18n')),
                      el.getAttribute('data-i18n-attr') || 'text');
    });

    /* data-i18n-title / data-i18n-placeholder: a SEPARATE key per
       attribute. `data-i18n-attr` can feed several attributes but only
       from one key, which breaks down on the elements that have both
       visible text and a tooltip saying something different — the
       list-formatting buttons say "Number" and mean "Convert to numbered
       list". Those needed a second key, not a second attribute name. */
    /* Numbered headings — "Step 3:", "Content 2:". They cannot use a
       plain data-i18n because the number is part of the rendered string
       and belongs to the row, not the dictionary. The index rides along
       in data-i18n-num-v0 so a language switch can rebuild the phrase
       without re-rendering the row (which would discard what is typed
       in it). */
    document.querySelectorAll('[data-i18n-num]').forEach(function (el) {
      _safeUpdate(el, tf(el.getAttribute('data-i18n-num'),
                        { v0: el.getAttribute('data-i18n-num-v0') }), 'text');
    });

    ['title', 'placeholder'].forEach(function (attr) {
      document.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
        _safeUpdate(el, t(el.getAttribute('data-i18n-' + attr)), attr);
      });
    });
    document.documentElement.lang = _current;

    /* ---- RTL layer -------------------------------------------------
       dir is set on <html> so native form controls, scrollbars and
       text selection flip too; the body class is what dacum-rtl.css
       hooks into for the mirrored layout rules. Both are toggled
       here and nowhere else. ------------------------------------- */
    var rtl = RTL_LANGS.indexOf(_current) !== -1;
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.body.classList.toggle('mb-rtl', rtl);

    _syncSelector();
    window.dispatchEvent(new CustomEvent('mb:langchange', { detail: { lang: _current } }));

    /* Listeners re-render on the event above, so the audit has to wait a
       tick for their DOM writes to land. */
    if (typeof mbGetSetting === 'function' && mbGetSetting(MB_KEYS.i18nDebug) === '1') {
      setTimeout(audit, 0);
    }
  }

  /* Languages that need a mirrored layout. Kept as a list rather than
     an `=== 'ar'` test so Kurdish (ckb), Farsi and Urdu can be added
     later without touching applyTranslations. */
  var RTL_LANGS = ['ar', 'fa', 'ur', 'ckb', 'he'];

  var LANGS = [
    { code: 'en', label: 'EN', title: 'English' },
    { code: 'fr', label: 'FR', title: 'Fran\u00e7ais' },
    { code: 'ar', label: 'AR', title: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' }
  ];

  /* Highlight whichever pill matches the active language. Split out of
     applyTranslations because the pills are also re-synced when the
     toolbar is rebuilt by other modules. */
  function _syncSelector() {
    var wrap = document.getElementById('mbLangWrap');
    if (!wrap) return;
    wrap.querySelectorAll('.mb-lang-btn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === _current;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = _langLocked && !on;
      b.title = _langLocked ? t('dgLangLocked') : (b.getAttribute('data-title') || b.title);
    });
    wrap.classList.toggle('is-locked', _langLocked);
  }

  /* A three-way <select> costs two taps (open, choose) and hides the
     current language behind a closed control. Three pills cost one tap
     and keep the active language visible at all times \u2014 which matters
     on a bar a facilitator is operating in front of a room. */
  function _injectSelector() {
    if (document.getElementById('mbLangWrap')) return;

    var wrap = document.createElement('div');
    wrap.id = 'mbLangWrap';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language / \u0627\u0644\u0644\u063a\u0629');

    LANGS.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mb-lang-btn';
      b.setAttribute('data-lang', L.code);
      b.textContent = L.label;
      b.title = L.title;
      b.setAttribute('data-title', L.title);
      b.addEventListener('click', function () { setLang(L.code); });
      wrap.appendChild(b);
    });

    var right = document.querySelector('#mbLangHost');
    if (right) right.insertBefore(wrap, right.firstChild);
    else { var tb = document.getElementById('mbLangHost'); if (tb) tb.appendChild(wrap); }
  }

  window.i18n = {
    t: t, tf: tf, setLang: setLang, getLang: getLang, apply: applyTranslations,
    isRTL: function () { return RTL_LANGS.indexOf(_current) !== -1; },
    has: function (key) { return TRANSLATIONS.en[key] !== undefined; },
    audit: audit,

    /* Look a key up in an EXPLICIT language, ignoring the current one.
       The DOCX export needs this: its strings must follow exportLang, not
       the interface. Someone working in an English interface exporting an
       Arabic module must get Arabic table headers — using t() there would
       silently emit English into an Arabic deliverable. */
    tIn: function (key, code) {
      var d = TRANSLATIONS[code] || TRANSLATIONS.en;
      var v = d[key];
      if (v === undefined) v = TRANSLATIONS.en[key];
      return v === undefined ? key : v;
    },
    tfIn: function (key, code, vars) {
      var s = window.i18n.tIn(key, code);
      if (!vars) return s;
      return s.replace(/\{(\w+)\}/g, function (m, k) {
        return vars[k] !== undefined ? vars[k] : m;
      });
    },
    lockLang: lockLang,
    isLangLocked: isLangLocked,
    aiDirective: aiDirective,
    tp: tp
  };

  function _init() { _injectSelector(); applyTranslations(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else { _init(); }

})();