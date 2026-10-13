document.addEventListener('DOMContentLoaded', () => {
    const topicField = document.getElementById('inquiry-topic');
    if (!topicField) return;

    const topic = new URLSearchParams(window.location.search).get('topic');
    if (['school', 'partner', 'programme', 'other'].includes(topic)) {
        topicField.value = topic;
    }
});
