document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message and select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "participant-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHtml = (details.participants && details.participants.length)
          ? `<ul class="participants-list">${details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="participant-remove" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" title="Remove ${p}">✕</button></li>`).join('')}</ul>`
          : `<ul class="participants-list"><li class="muted">No participants yet</li></ul>`;

        activityCard.setAttribute('data-activity', encodeURIComponent(name));
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach click handler via event delegation (on container) — handled below

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Optimistically update the activity card in-place so UI reflects change immediately
        try {
          const card = activitiesList.querySelector(`[data-activity="${encodeURIComponent(activity)}"]`);
          if (card) {
            const ul = card.querySelector('.participants-list');
            if (ul) {
              // If placeholder exists, clear it
              const muted = ul.querySelector('li.muted');
              if (muted) ul.innerHTML = '';
              const li = document.createElement('li');
              li.innerHTML = `<span class="participant-email">${email}</span><button class="participant-remove" data-activity="${encodeURIComponent(activity)}" data-email="${encodeURIComponent(email)}" title="Remove ${email}">✕</button>`;
              ul.appendChild(li);
            }
            // Update availability text if present
            const avail = card.querySelector('.availability');
            if (avail) {
              const m = avail.textContent.match(/(\d+) spots left/);
              if (m) {
                const newSpots = Math.max(0, Number(m[1]) - 1);
                avail.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;
              }
            }
          }
        } catch (err) {
          console.warn('Optimistic UI update failed', err);
        }

        // Refresh activities to ensure consistent state
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Event delegation for participant removal buttons
  activitiesList.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.classList.contains('participant-remove')) {
      const activity = decodeURIComponent(target.dataset.activity);
      const email = decodeURIComponent(target.dataset.email);
      if (!confirm(`Remove ${email} from ${activity}?`)) return;

      try {
        const res = await fetch(
          `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );

        const result = await res.json();

        if (res.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = 'success';
          // Refresh the list to reflect removal
          await fetchActivities();
        } else {
          messageDiv.textContent = result.detail || 'Failed to remove participant';
          messageDiv.className = 'error';
        }
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
      } catch (err) {
        messageDiv.textContent = 'Failed to remove participant.';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
        console.error('Error removing participant:', err);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
// participant validation
// step 3 participant check
// rerun step 3 after invalid revision range
