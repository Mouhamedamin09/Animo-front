
import { 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Dimensions, 
  ActivityIndicator,
  Modal,
} from 'react-native';
import React, { useState } from 'react';
import { XMarkIcon, FunnelIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { fetchAnimeSearch } from './api/AnimeDB';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    type: '',
    score: '',
    year: '',
    season: '',
    rating: '',
  });
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setLoading(true);
      try {
        const searchResults = await fetchAnimeSearch(query, filters);
        setResult(searchResults.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setResult([]);
    }
  };

  const FilterModal = () => {
    return (
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Filter Options</Text>

            {/* Type Picker */}
            <Text style={styles.modalLabel}>Type:</Text>
            <Picker
              selectedValue={filters.type}
              onValueChange={(itemValue) =>
                setFilters((prev) => ({ ...prev, type: itemValue }))
              }
              style={styles.picker}
            >
              <Picker.Item label="All" value="" />
              <Picker.Item label="TV" value="tv" />
              <Picker.Item label="Movie" value="movie" />
              <Picker.Item label="OVA" value="ova" />
              <Picker.Item label="Special" value="special" />
              <Picker.Item label="ONA" value="ona" />
              <Picker.Item label="Music" value="music" />
            </Picker>

            {/* Minimum Score Picker */}
            <Text style={styles.modalLabel}>Minimum Score:</Text>
            <Picker
              selectedValue={filters.score}
              onValueChange={(itemValue) =>
                setFilters((prev) => ({ ...prev, score: itemValue }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Any" value="" />
              {Array.from({ length: 10 }, (_, i) => (
                <Picker.Item key={i + 1} label={`${i + 1}`} value={`${i + 1}`} />
              ))}
            </Picker>

            {/* Year Picker */}
            <Text style={styles.modalLabel}>Year of Release:</Text>
            <Picker
              selectedValue={filters.year}
              onValueChange={(itemValue) =>
                setFilters((prev) => ({ ...prev, year: itemValue }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Any" value="" />
              {Array.from({ length: 30 }, (_, i) => {
                const year = 2025 - i;
                return <Picker.Item key={year} label={`${year}`} value={`${year}`} />;
              })}
            </Picker>

            {/* Season Picker */}
            <Text style={styles.modalLabel}>Season:</Text>
            <Picker
              selectedValue={filters.season}
              onValueChange={(itemValue) =>
                setFilters((prev) => ({ ...prev, season: itemValue }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Any" value="" />
              <Picker.Item label="Winter" value="winter" />
              <Picker.Item label="Spring" value="spring" />
              <Picker.Item label="Summer" value="summer" />
              <Picker.Item label="Fall" value="fall" />
            </Picker>

            {/* Rating Picker */}
            <Text style={styles.modalLabel}>Rating:</Text>
            <Picker
              selectedValue={filters.rating}
              onValueChange={(itemValue) =>
                setFilters((prev) => ({ ...prev, rating: itemValue }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Any" value="" />
              <Picker.Item label="All Ages" value="g" />
              <Picker.Item label="Children" value="pg" />
              <Picker.Item label="Teens 13+" value="pg13" />
              <Picker.Item label="17+ (violence & profanity)" value="r17" />
              <Picker.Item label="Mild Nudity" value="r" />
              <Picker.Item label="Hentai" value="rx" />
            </Picker>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setIsFilterModalVisible(false);
                  handleSearch(searchQuery);
                }}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setFilters({
                    type: '',
                    score: '',
                    year: '',
                    season: '',
                    rating: '',
                  });
                }}
              >
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TextInput
          placeholder="Search Anime"
          placeholderTextColor="lightgray"
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity
          onPress={() => setIsFilterModalVisible(true)}
          style={styles.filterButton}
        >
          <FunnelIcon size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <XMarkIcon size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal />

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5abf75" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.resultsContainer}
        >
          {result.length > 0 ? (
            <>
              <Text style={styles.resultCount}>Results ({result.length})</Text>
              <View style={styles.grid}>
                {result.map((item, index) => {
                  const animeTitle =
                    item.title.length > 20
                      ? item.title.slice(0, 20) + '...'
                      : item.title;
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() =>
                        navigation.push('Anime', { mal_id: item.mal_id })
                      }
                      style={styles.card}
                    >
                      <Image
                        source={{ uri: item.images.jpg.large_image_url }}
                        style={styles.image}
                      />
                      <Text style={styles.title}>{animeTitle}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    backgroundColor: '#262626',
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#5abf75',
    borderRadius: 20,
    marginLeft: 10,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#5abf75',
    borderRadius: 20,
    marginLeft: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
  resultsContainer: {
    padding: 15,
  },
  resultCount: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: width * 0.45,
    backgroundColor: '#262626',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: height * 0.25,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  title: {
    color: 'white',
    fontSize: 14,
    padding: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    color: 'lightgray',
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: '#262626',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalLabel: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  picker: {
    color: 'white',
    backgroundColor: '#3a3a3a',
    borderRadius: 10,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  applyButton: {
    backgroundColor: '#5abf75',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#ff4d4d',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
};
