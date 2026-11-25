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
    const label = intro?.querySelector('.agency-label');
    const heading = intro?.querySelector('h1');
    const headingMarker = heading?.querySelector('em');
    const description = intro?.querySelector('p');
    const sidebar = document.querySelector('.inquiry-sidebar');
    const quickContact = sidebar?.querySelector('.inquiry-quick-contact');
    const mainContent = document.getElementById('main-content');

    const defaultMarkerText = headingMarker?.textContent || '';
    const defaultPrefixText = heading && headingMarker
        ? heading.textContent.slice(0, heading.textContent.lastIndexOf(defaultMarkerText))
        : (heading?.textContent || '');
    const defaultIntro = [label?.textContent || '', defaultPrefixText, defaultMarkerText, description?.textContent || ''];

    function updateTopicPresentation() {
        const isSchoolRequest = topicField.value === 'school';
        const [labelText, prefix, marker, descriptionText] = isSchoolRequest
            ? ['School visits', 'Invite Hilth to ', 'your school', 'Tell us about your school and we’ll get in touch about a possible visit.']
            : defaultIntro;

        if (label) label.textContent = labelText;
        if (heading && headingMarker) {
            headingMarker.textContent = marker;
            heading.replaceChildren(document.createTextNode(prefix), headingMarker);
        }
        if (description) description.textContent = descriptionText;

        if (messageHelp) messageHelp.hidden = !isSchoolRequest;
        if (message && messageHelp) {
            if (isSchoolRequest) {
                message.setAttribute('aria-describedby', messageHelp.id);
            } else {
                message.removeAttribute('aria-describedby');
            }
        }

        if (sidebar && quickContact && topicField.form) {
            if (isSchoolRequest) {
                topicField.form.after(quickContact);
                sidebar.hidden = true;
                mainContent?.classList.add('school-enquiry');
            } else {
                sidebar.append(quickContact);
                sidebar.hidden = false;
                mainContent?.classList.remove('school-enquiry');
            }
        }
    }

    topicField.addEventListener('change', updateTopicPresentation);
    updateTopicPresentation();
});
