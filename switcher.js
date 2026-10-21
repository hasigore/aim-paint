document.addEventListener("DOMContentLoaded", () => {
   // 1. Switcher-HTML erstellen und einfügen
   const switcherDiv = document.createElement('div');
   switcherDiv.id = 'global-scenario-switcher';
   switcherDiv.innerHTML = `
      <label for="global-scenario-select">Scenario:</label>
      <select id="global-scenario-select">
         <option value="" disabled selected>Loading...</option>
      </select>
   `;
   document.body.appendChild(switcherDiv);

   // 2. scenarios.txt laden und Dropdown füllen
   fetch('scenarios.txt')
      .then(response => {
         if (!response.ok) throw new Error("Could not load scenarios file.");
         return response.text();
      })
      .then(data => {
         const selectEl = document.getElementById('global-scenario-select');
         selectEl.innerHTML = '<option value="" disabled>-- Switch Scenario --</option>';

         const lines = data.split('\n');
         const currentFileName = window.location.pathname.split('/').pop();

         lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            const parts = trimmed.split(',');
            if (parts.length >= 2) {
               const headingText = parts[0].trim();
               const filename = parts[1].trim() + '.html';

               const option = document.createElement('option');
               option.value = filename;
               option.textContent = headingText;

               // Aktive Seite vorauswählen
               if (filename === currentFileName) {
                  option.selected = true;
               }

               selectEl.appendChild(option);
            }
         });
      })
      .catch(error => console.error("Error loading scenarios for switcher:", error));

   // 3. On-the-fly Wechsel bei Änderung
   document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'global-scenario-select') {
         const selectedFile = e.target.value;
         if (selectedFile) {
            window.location.href = selectedFile;
         }
      }
   });
});
