const filterButtons = document.querySelectorAll('[data-course-filter]');
const universityBlocks = document.querySelectorAll('[data-university]');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const selected = button.dataset.courseFilter;

    filterButtons.forEach(item => {
      item.classList.toggle('is-active', item === button);
    });

    universityBlocks.forEach(block => {
      const visible =
        selected === 'all' ||
        block.dataset.university === selected;

      block.hidden = !visible;
    });
  });
});
