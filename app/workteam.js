// ============================================================
// /src/workteam.js
// Work team members
// Extracted verbatim from Module_Builder.html lines 2336-2420 (v2.0-legacy).
// ============================================================

function initializeWorkTeam() {
    renderWorkTeam();
}

/**
 * One empty row, always.
 *
 * The card used to open on the sentence "no team members yet", which
 * reads as a status report rather than an invitation: several users
 * took the card for a display of something filled in elsewhere and
 * never found the button. A visible row of empty fields says what the
 * card is for without a word of instruction. "Add member" keeps its
 * job — every member after the first.
 *
 * Called from renderWorkTeam rather than seeded in mb_state.js, because
 * the state is replaced wholesale on three other paths (new project,
 * reset, and opening a file that has an empty team) and each of them
 * ends in a render. Putting it here covers all four with one line;
 * seeding the initial value would cover only the first.
 *
 * Pairs, not bare strings: the row is v4-shaped from the moment it
 * exists, so nothing downstream depends on biPut's legacy-string
 * upgrade to make it so.
 */
function mbEnsureTeamMemberRow() {
    if (mbState.teamMembers.length) return;
    mbState.teamMemberIdCounter++;
    mbState.teamMembers.push({
        id: mbState.teamMemberIdCounter,
        name: biNew(),
        task: biNew(),
        workLocation: biNew()
    });
}

function renderWorkTeam() {
    const container = document.getElementById('work-team-container');
    if (!container) return;

    mbEnsureTeamMemberRow();

    
    container.innerHTML = mbState.teamMembers.map((member, index) => `
        <div class="team-member-row" style="display: grid; grid-template-columns: 2fr 2fr 2fr auto; gap: 10px; align-items: center; padding: 12px; border-bottom: 1px solid #e5e7eb; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <input type="text" 
                   id="team-name-${member.id}" 
                   value="${escapeHtml(biGetStrict(member.name, contentLang()))}" 
                   data-act="updateTeamMember" data-on="change" data-args='[${member.id},"name"]'
                   placeholder="${window.i18n.t('dgTeamName')}" data-i18n-placeholder="dgTeamName" 
                   style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
                   class="mb-content-field">
            <input type="text" 
                   id="team-task-${member.id}" 
                   value="${escapeHtml(biGetStrict(member.task, contentLang()))}" 
                   data-act="updateTeamMember" data-on="change" data-args='[${member.id},"task"]'
                   placeholder="${window.i18n.t('dgTeamTask')}" data-i18n-placeholder="dgTeamTask" 
                   style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
                   class="mb-content-field">
            <input type="text" 
                   id="team-location-${member.id}" 
                   value="${escapeHtml(biGetStrict(member.workLocation, contentLang()))}" 
                   data-act="updateTeamMember" data-on="change" data-args='[${member.id},"workLocation"]'
                   placeholder="${window.i18n.t('dgTeamLocation')}" data-i18n-placeholder="dgTeamLocation" 
                   style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;"
                   class="mb-content-field">
            <button data-act="deleteTeamMember" data-args='[${member.id}]' 
                    style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">
                🗑️
            </button>
        </div>
    `).join('');
}

function updateTeamMember(memberId, field) {
    const member = mbState.teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    /* The DOM id uses the field name directly, and `workLocation` is the
       field but `team-location-…` is the id. */
    const domField = field === 'workLocation' ? 'location' : field;
    const input = document.getElementById(`team-${domField}-${memberId}`);
    if (input) biPut(member, field, input.value);
}

function addTeamMember() {
    mbState.teamMemberIdCounter++;
    mbState.teamMembers.push({
        id: mbState.teamMemberIdCounter,
        name: biNew(),
        task: biNew(),
        workLocation: biNew()
    });
    renderWorkTeam();
}

async function deleteTeamMember(memberId) {
    /* The last row is CLEARED, not removed. Removing it would land in
       mbEnsureTeamMemberRow on the next render and come straight back
       with a new id, which looks like the delete button is broken. The
       row keeps its id so nothing that referenced it goes stale, and
       BOTH languages are wiped: the user asked for the member to be
       gone, not for the side they happen to be editing to be gone.

       The two cases get two different confirm texts. A prompt that
       promises permanent removal before an action that visibly leaves
       the row on screen teaches the user to distrust every other
       confirm dialog in the app. */
    const isLast = mbState.teamMembers.length === 1;
    const msgKey = isLast ? 'dgConfirmClearLastTeamMember'
                          : 'dgConfirmDeletionthisWillPermanently9';
    if (!await mbConfirm(window.i18n.t(msgKey), { danger: true })) return;

    if (isLast) {
        const member = mbState.teamMembers[0];
        member.name         = biNew();
        member.task         = biNew();
        member.workLocation = biNew();
    } else {
        mbState.teamMembers = mbState.teamMembers.filter(m => m.id !== memberId);
    }
    renderWorkTeam();
}

function saveWorkTeamData() {
    // Update values from inputs before saving
    mbState.teamMembers.forEach(member => {
        const nameInput = document.getElementById(`team-name-${member.id}`);
        const taskInput = document.getElementById(`team-task-${member.id}`);
        const locationInput = document.getElementById(`team-location-${member.id}`);
        
        /* Bilingual pairs since v4 — see the note in covers.js. */
        if (nameInput)     biPut(member, 'name', nameInput.value);
        if (taskInput)     biPut(member, 'task', taskInput.value);
        if (locationInput) biPut(member, 'workLocation', locationInput.value);
    });
}
