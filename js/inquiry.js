document.addEventListener('DOMContentLoaded', () => {
    const topicField = document.getElementById('inquiry-topic');
    if (!topicField) return;

    const topic = new URLSearchParams(window.location.search).get('topic');
    if (['school', 'partner', 'programme', 'other'].includes(topic)) {
        topicField.value = topic;
    }

    const message = document.getElementById('inquiry-message');
    const messageHelp = document.getElementById('inquiry-message-help');
    const intro = document.querySelector('.inquiry-intro');
    const label = intro.querySelector('.agency-label');
    const heading = intro.querySelector('h1');
    const headingPrefix = heading.firstChild;
    const headingMarker = heading.querySelector('em');
    const description = intro.querySelector('p');
    const defaultIntro = [label.textContent, headingPrefix.textContent, headingMarker.textContent, description.textContent];

    function updateTopicPresentation() {
        const isSchoolRequest = topicField.value === 'school';
        const [labelText, prefix, marker, descriptionText] = isSchoolRequest
            ? ['School visits', 'Invite Hilth to ', 'your school', 'Tell us about your school and we’ll get in touch about a possible visit.']
            : defaultIntro;
        label.textContent = labelText;
        headingPrefix.textContent = prefix;
        headingMarker.textContent = marker;
        description.textContent = descriptionText;

        messageHelp.hidden = !isSchoolRequest;
        if (isSchoolRequest) {
            message.setAttribute('aria-describedby', messageHelp.id);
        } else {
            message.removeAttribute('aria-describedby');
        }
    }
    topicField.addEventListener('change', updateTopicPresentation);
    updateTopicPresentation();

    if (topic === 'school') {
        const sidebar = document.querySelector('.inquiry-sidebar');
        const form = topicField.form;
        form.after(sidebar.querySelector('.inquiry-quick-contact'));
        sidebar.hidden = true;
        document.getElementById('main-content').classList.add('school-enquiry');
    }
});
