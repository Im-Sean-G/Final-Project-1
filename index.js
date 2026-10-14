const API_KEY = "e9ef3d5c";
const BASE_URL = "https://www.omdbapi.com/";

const movieGrid = document.getElementById("movies-grid");
const movieSort = document.getElementById("movie-sort");
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

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const thumbnail = document.createElement("div");
  thumbnail.className = "movie-card__thumb";

  if (movie.Poster && movie.Poster !== "N/A") {
    try {
      const posterURL = new URL(movie.Poster);
      if (posterURL.protocol === "https:" || posterURL.protocol === "http:") {
        const image = document.createElement("img");
        image.src = posterURL.href;
        image.alt = `${movie.Title || "Movie"} poster`;
        thumbnail.append(image);
      }
    } catch {}
  }

  const details = document.createElement("div");
  details.className = "movie-card__details";

  const title = document.createElement("h3");
  title.className = "movie-card__title";
  title.textContent = movie.Title || "Untitled";

  const metadata = document.createElement("div");
  metadata.className = "movie-card__meta";

  const year = document.createElement("span");
  year.className = "movie-card__year";
  year.textContent = movie.Year || "N/A";

  const rating = document.createElement("span");
  rating.className = "movie-card__rating";
  rating.textContent = movie.Rated || "N/A";

  metadata.append(year, rating);

  const imdb = document.createElement("div");
  imdb.className = "movie-card__imdb";

  const imdbLabel = document.createElement("span");
  imdbLabel.textContent = "IMDb";

  const imdbRating = document.createElement("strong");
  imdbRating.textContent = movie.imdbRating || "N/A";

  imdb.append(imdbLabel, imdbRating);
  details.append(title, metadata, imdb);
  card.append(thumbnail, details);

  return card;
}

function renderMovies(movies) {
  if (!movieGrid) return;

  if (!movies || movies.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "movie-empty";
    emptyMessage.textContent = "No movies found. Try another search.";
    movieGrid.replaceChildren(emptyMessage);
    return;
  }

  movieGrid.replaceChildren(...movies.map(createMovieCard));
  sortRenderedMovies();
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

function sortRenderedMovies() {
  if (!movieGrid || !movieSort) return;

  const getYear = (card) =>
    Number.parseInt(card.querySelector(".movie-card__year").textContent, 10);
  const getRating = (card) =>
    Number.parseFloat(
      card.querySelector(".movie-card__imdb strong").textContent,
    );
  const compareNumbers = (valueA, valueB, descending = false) => {
    if (Number.isNaN(valueA)) return Number.isNaN(valueB) ? 0 : 1;
    if (Number.isNaN(valueB)) return -1;
    return descending ? valueB - valueA : valueA - valueB;
  };
  const sorters = {
    title: (a, b) =>
      a
        .querySelector(".movie-card__title")
        .textContent.localeCompare(
          b.querySelector(".movie-card__title").textContent,
        ),
    year: (a, b) => compareNumbers(getYear(a), getYear(b), true),
    "year-oldest": (a, b) => compareNumbers(getYear(a), getYear(b)),
    rating: (a, b) => compareNumbers(getRating(a), getRating(b), true),
    "rating-lowest": (a, b) => compareNumbers(getRating(a), getRating(b)),
  };
  const compare = sorters[movieSort.value];
  if (!compare) return;

  const cards = [...movieGrid.querySelectorAll(".movie-card")];
  cards.sort(compare);
  movieGrid.append(...cards);
}

movieSort?.addEventListener("change", sortRenderedMovies);

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
