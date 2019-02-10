document.addEventListener('DOMContentLoaded', ()=>{
    Array.from(document.querySelectorAll('.menu__item')).forEach(element => {
        element.onclick = ()=>{
            if(!element.classList.contains('menu__item_active')){
                Array.from(document.querySelector('.menu__list').children).forEach(child=>{
                    child.classList.remove('menu__item_active');
                })
                element.classList.add('menu__item_active');
            }
        }
    });
});