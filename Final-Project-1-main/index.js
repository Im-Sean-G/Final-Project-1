const API_KEY = "e9ef3d5c";
const BASE_URL = "https://www.omdbapi.com/";

const movieGrid = document.getElementById("movies-grid");
const searchInput = document.getElementById("search-input");
const searchButton = document.querySelector(
  ".search__button--movies, .search__button",
);

function setLoadingState(isLoading) {
  if (!searchButton) return;

  searchButton.disabled = isLoading;
  searchButton.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    searchButton.innerHTML = `
      <span class="loading-dots" aria-label="Loading">
        <span></span>
        <span></span>
        <span></span>
      </span>
    `;
    return;
  }

  searchButton.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
}

function renderMovies(movies) {
  if (!movieGrid) return;

  if (!movies || movies.length === 0) {
    movieGrid.innerHTML =
      '<p class="movie-empty">No movies found. Try another search.</p>';
    return;
  }

  movieGrid.innerHTML = movies
    .map(
      (movie) => `
        <article class="movie-card">
          <div class="movie-card__thumb">
            ${
              movie.Poster && movie.Poster !== "N/A"
                ? `<img src="${movie.Poster}" alt="${movie.Title} poster" />`
                : ""
            }
          </div>
          <div class="movie-card__details">
            <h3 class="movie-card__title">${movie.Title}</h3>
            <div class="movie-card__meta">
              <span class="movie-card__year">${movie.Year}</span>
              <span class="movie-card__rating">${movie.Rated || "N/A"}</span>
            </div>
            <div class="movie-card__imdb">
              <span>IMDb</span>
              <strong>${movie.imdbRating || "N/A"}</strong>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

async function fetchMovieDetails(imdbId) {
  const response = await fetch(
    `${BASE_URL}?apikey=${API_KEY}&i=${encodeURIComponent(imdbId)}`,
  );
  const data = await response.json();
  return data;
}

async function searchMovies(customQuery = "") {
  const query = (customQuery || searchInput?.value || "").trim();

  if (!query) {
    setLoadingState(false);
    return;
  }

  if (!movieGrid) {
    window.location.href = `movies.html?search=${encodeURIComponent(query)}`;
    return;
  }

  setLoadingState(true);

  try {
    const response = await fetch(
      `${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}`,
    );
    const data = await response.json();

    if (!data.Search) {
      renderMovies([]);
      return;
    }

    const detailedMovies = await Promise.all(
      data.Search.slice(0, 8).map(async (movie) => {
        const details = await fetchMovieDetails(movie.imdbID);
        return {
          ...movie,
          Rated: details.Rated || "N/A",
          imdbRating: details.imdbRating || "N/A",
        };
      }),
    );

    renderMovies(detailedMovies);
  } catch (error) {
    console.error("OMDb fetch error:", error);
    renderMovies([]);
  } finally {
    setLoadingState(false);
  }
}

if (searchButton) {
  searchButton.addEventListener("click", () => searchMovies());
}

if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchMovies();
    }
  });

  if (!searchInput.value.trim()) {
    setLoadingState(false);
  }
}

if (movieGrid) {
  const initialQuery = new URLSearchParams(window.location.search).get(
    "search",
  );
  if (initialQuery) {
    searchInput.value = initialQuery;
    searchMovies(initialQuery);
  }
}
