const API_KEY = 'c100ffce';
const toggle = document.getElementById('darkmode-toggle');

toggle.addEventListener('change', () => {
  const isDark = toggle.checked;
  document.body.classList.toggle('dark-theme', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
  toggle.checked = true;
}


//DOM
const input = document.querySelector('.header-search-form input');
const button = document.querySelector('.header-search-form button');
const ratingFilter = document.getElementById('ratingFilter');
const resultsList = document.querySelector('.main-section-card');
const paginationContainer = document.getElementById('pagination');
let currentQuery = '';
let paginationInstance = null;

//Топ нових фільмів 
const TOP_MOVIES = [
    'tt1745960', //Top Gun: Maverick (2022)
    'tt15398776', //Oppenheimer (2023)
    'tt10151854',// Shazam! Fury of the Gods (2023)
    'tt15239678', //Dune: Part Two (2024)
    'tt1877830',//The Batman (2022)
    'tt11358390',//Renfield (2023)
    'tt10640346',
    'tt10298810',
    'tt6791350',
    'tt13238346',
    'tt1630029',
    'tt6710474',
];

// Відображення фільмів за imdbID 
function displayMoviesByIds(imdbIds) {
    if (imdbIds.length === 0) {
        resultsList.innerHTML = '<li><p>No movies found</p></li>';
        return;
    }

    const promises = imdbIds.map(id =>
        fetch(`https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`)
            .then(response => response.json())
    );

    Promise.all(promises)
        .then(fullMovies => {
            const minRating = parseFloat(ratingFilter?.value);
            let filtered = fullMovies;

            if (!isNaN(minRating)) {
                filtered = fullMovies.filter(movie => {
                    const r = parseFloat(movie.imdbRating);
                    return !isNaN(r) && r >= minRating;
                });
            }

            if (filtered.length === 0) {
                resultsList.innerHTML = '<li><p>No movies match the rating filter</p></li>';
                return;
            }

            resultsList.innerHTML = filtered.map(movie => `
        <li class="movie-card">
          <img src="${movie.Poster === 'N/A' ? 'https://via.placeholder.com/300x420?text=No+Poster' : movie.Poster}" alt="${movie.Title}" />
          <div class="movie-info">
            <h3>${movie.Title} (${movie.Year})</h3>
            <p><strong>Director:</strong> ${movie.Director}</p>
            <p><strong>Actors:</strong> ${movie.Actors}</p>
            <p><strong>IMDb:</strong> ${movie.imdbRating || 'N/A'}</p>
            <p>${movie.Plot || 'No description'}</p>
          </div>
        </li>
      `).join('');
        })
        .catch(() => {
            resultsList.innerHTML = '<li><p>Loading...</p></li>';
        });
}

//Пошук фільмів
function searchMovies(query) {
    currentQuery = query;

    if (query === '') {
        displayMoviesByIds(TOP_MOVIES);
        if (paginationInstance) paginationInstance.setTotalItems(0);
        return;
    }

    fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            if (data.Response === 'True') {
                const ids = data.Search.slice(0, 12).map(m => m.imdbID);
                displayMoviesByIds(ids);

                const total = Math.min(parseInt(data.totalResults), 100);
                initPagination(total, 1);
            } else {
                resultsList.innerHTML = '<li><p>No movies found</p></li>';
                if (paginationInstance) paginationInstance.setTotalItems(0);
            }
        })
        .catch(() => {
            resultsList.innerHTML = '<li><p>Loading . . .</p></li>';
        });
}

//Обробка подій
button.addEventListener('click', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    searchMovies(query);
});

//Початкове завантаження
searchMovies('');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.modal-close');
const modalPoster = document.querySelector('.modal-poster');
const modalTitle = document.querySelector('.modal-title');
const modalYear = document.querySelector('.modal-year');
const modalDirector = document.querySelector('.modal-director');
const modalActors = document.querySelector('.modal-actors');
const modalRating = document.querySelector('.modal-rating');
const modalPlot = document.querySelector('.modal-plot');

// Відкриття модалки 
resultsList.addEventListener('click', (e) => {
    const card = e.target.closest('.movie-card');
    if (!card) return;

    const title = card.querySelector('h3')?.textContent;
    const poster = card.querySelector('img')?.src;
    const info = card.querySelector('.movie-info')?.innerText.split('\n');

    modalPoster.src = poster;
    modalTitle.textContent = title;
    modalDirector.textContent = info[1] || '';
    modalActors.textContent = info[2] || '';
    modalRating.textContent = info[3] || '';
    modalPlot.textContent = info[4] || '';

    modal.classList.remove('hidden');
});

// Закриття модалки
modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.add('hidden');
});