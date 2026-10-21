document.addEventListener("DOMContentLoaded", () => {
   // 1. Create the switcher element
   const switcherDiv = document.createElement('div');
   switcherDiv.id = 'global-scenario-switcher';
   switcherDiv.innerHTML = `
      <label for="global-scenario-select">Scenario:</label>
      <select id="global-scenario-select">
      </select>
   `;
   
   // 2. Insert it at the absolute top of the body
   document.body.prepend(switcherDiv);

   // 3. Fetch scenarios.txt and populate dropdown
   fetch('scenarios.txt')
      .then(response => {
         if (!response.ok) throw new Error("Could not load scenarios file.");
         return response.text();
      })
      .then(data => {
         const selectEl = document.getElementById('global-scenario-select');

         const lines = data.split('\n');
         const currentFileName = window.location.pathname.split('/').pop();

         lines.forEach(line => {
            const trimmed = line.trim();
            
            // Skip empty lines AND lines that start with '#' (comments)
            if (!trimmed || trimmed.startsWith('#')) return;

            const parts = trimmed.split(',');
            if (parts.length >= 2) {
               const headingText = parts[0].trim();
               const filename = 'html/'+ parts[1].trim() + '.html';

               const option = document.createElement('option');
               option.value = filename;
               option.textContent = headingText;

               if (filename === currentFileName) {
                  option.selected = true;
               }

               selectEl.appendChild(option);
            }
         });
      })
      .catch(error => console.error("Error loading scenarios for switcher:", error));
   
   // 4. On-the-fly switching
   document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'global-scenario-select') {
         const selectedFile = e.target.value;
         if (selectedFile) {
            window.location.href = selectedFile;
         }
      }
   });
});
