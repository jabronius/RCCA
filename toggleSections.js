document.addEventListener('DOMContentLoaded', function () {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                if (targetSection.style.display === 'none' || targetSection.style.display === '') {
                    targetSection.style.display = 'block';
                    console.log('Section opened:', targetId);
                } else {
                    targetSection.style.display = 'none';
                    console.log('Section closed:', targetId);
                }
            } else {
                console.error('Section with ID', targetId, 'not found.');
            }
        });
    });
});
