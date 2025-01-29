import axios from 'axios';

const baseUrl = "https://api.jikan.moe/v4";
const topRatedAnimes = `${baseUrl}/top/anime?filter=bypopularity`;
const trandingAnimes=`${baseUrl}/top/anime`;
const upcomingAnime = `${baseUrl}/top/anime?filter=upcoming`;
const RecommendationsAnime="https://api.jikan.moe/v4/recommendations/anime"
const topCharactersEndpoint = `${baseUrl}/top/characters`;



const apiCall = async (endpoint) => {
    const options = {
        method: 'GET',
        url: endpoint,
        
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        
        console.error("Error:", error);
        throw error;
    }
};

export const fetchTopCharacters = async (page = 1) => { 
    const endpoint = `${topCharactersEndpoint}?page=${page}`;
    return await apiCall(endpoint);
};

export const fetchTrendingAnimes = async () => {
    return await apiCall(trandingAnimes); 
};

export const fetchUpcomingAnimes = async () => {
    return await apiCall(upcomingAnime);
};

export const fetchTopAnimes = async () => {
    return await apiCall(topRatedAnimes);
};

export const fetchAnimeCharecters = async (AnimeId) => {
    const Animecharacters = `${baseUrl}/anime/${AnimeId}/characters`;
    return await apiCall(Animecharacters);
};

export const fetchRecommendation = async () => {
    return await apiCall(RecommendationsAnime);
};
export const fetchAnimeById = async (AnimeId) => {
    const animeDetails = `${baseUrl}/anime/${AnimeId}`;
    return await apiCall(animeDetails);
};
export const fetchAnimeSearch = async (query, filters = {}) => {
    const { type, score, year, season, rating } = filters;
    let searchEndpoint = `${baseUrl}/anime?q=${encodeURIComponent(query)}`;
  
    if (type) searchEndpoint += `&type=${type}`;
    if (score) searchEndpoint += `&score=${score}`;
    if (year) searchEndpoint += `&year=${year}`;
    if (season) searchEndpoint += `&season=${season}`;
    if (rating) searchEndpoint += `&rating=${rating}`;
  
    return await apiCall(searchEndpoint);
  };

export const fetchCharacterById = async (characterId) => {
    const response = await fetch(`https://api.jikan.moe/v4/characters/${characterId}`);
    const data = await response.json();
    return data;
};

export const fetchPictureById =async (characterId) => {
    const response=await fetch(`https://api.jikan.moe/v4/characters/${characterId}/pictures`)
    const data = await response.json();
    return data;
}

export const fetchVoiceActorById =async (characterId) => {
    const response=await fetch(`https://api.jikan.moe/v4/characters/${characterId}/voices`);
    const data = await response.json();
    return data;
}

export const fetchPersonById =async (personId) => {
    const response=await fetch(`https://api.jikan.moe/v4/people/${personId}`);
    const data = await response.json();
    return data;
}

export const fetchSeason =async (year,mawsem) => {
    const response=await fetch(`https://api.jikan.moe/v4/seasons/${year}/${mawsem}`);
    const data = await response.json();
    return data;
}

export const fetchUpcomingSeason =async () => {
    const response=await fetch(`https://api.jikan.moe/v4/seasons/upcoming`);
    const data = await response.json();
    return data;
}

