import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button, FormControl, Container, Row, Col, Image } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/MapList.css';
import { Map } from '../modules/mapApi';
import { mockMaps } from '../modules/mockData';
import Header from '../components/Header';
import { BreadCrumbs } from '../components/BreadCrumbs';
import { RootState } from '../store';
import { setSearchTerm } from '../store/searchSlice';
import axiosInstance from '../modules/axios';

const MapList: React.FC = () => {
  const [maps, setMaps] = useState<Map[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draftPoolCount, setDraftPoolCount] = useState<number>(0); 
  const defaultImageUrl = 'http://127.0.0.1:9000/mybucket/map_not_found.png';
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated); 
  const searchTerm = useSelector((state: RootState) => state.search.searchTerm);
  const dispatch = useDispatch();

  const filterMaps = (title: string) => {
    if (title) {
      return mockMaps.filter((map) =>
        map.title.toLowerCase().includes(title.toLowerCase())
      );
    }
    return mockMaps;
  };

  const fetchMaps = async (title: string = '') => {
    try {
      const response = await axiosInstance.get(`/api/maps/`, {
        params: { title },
        withCredentials: true,
      });
      console.log('Request URL:', axiosInstance.defaults.baseURL + '/api/maps/');
      const data = response.data;

      if (data.maps) {
        setMaps(data.maps);
        setError(null);
      } else {
        setMaps([]);
        setError('Нет карт, соответствующих запросу');
      }
    } catch (error) {
      console.warn('Ошибка при загрузке карт, используем моковые данные');
      setMaps(filterMaps(title));
      setError('Ошибка при загрузке карт, используем моковые данные');
      console.error(error);
    }
  };

  const fetchDraftPoolInfo = async () => {
    try {
      const response = await axiosInstance.get(`/api/maps/`);
      const data = response.data;
      
      if (data.draft_pool_count !== undefined) {
        setDraftPoolCount(data.draft_pool_count); 
      }
    } catch (error) {
      console.error('Ошибка при загрузке информации о пуле карт', error);
    }
  };

  useEffect(() => {
    fetchMaps(searchTerm);
    if (isAuthenticated) {
      fetchDraftPoolInfo(); 
    }
  }, [searchTerm, isAuthenticated]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/maps?title=${encodeURIComponent(searchTerm)}`);
    fetchMaps(searchTerm);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(event.target.value));
  };

  const handleCartClick = () => {
    if (isAuthenticated) {
      navigate('/map_pools');
    } else {
      alert('Пожалуйста, авторизуйтесь, чтобы получить доступ к пулу карт.');
    }
  };

  const addToDraft = async (mapId: number) => {
    try {
      const response = await axiosInstance.post('/api/maps/draft/', { map_id: mapId });
      console.log(`Карта с ID ${mapId} успешно добавлена в пул заявок`, response.data);
      alert('Карта успешно добавлена в пул заявок');
    } catch (error) {
      console.error(`Ошибка при добавлении карты с ID ${mapId} в пул заявок`, error);
      alert('Произошла ошибка при добавлении карты');
    }
  };

  return (
    <>
      <Header />
      <BreadCrumbs crumbs={[{ label: 'Карты', path: '/maps' }]} />
      <div className="cart-icon-container">
        <FaShoppingCart
          size={30}
          onClick={handleCartClick}
          className="cart-icon"
          style={{ cursor: isAuthenticated ? 'pointer' : 'not-allowed' }}
        />
        {isAuthenticated && draftPoolCount > 0 && ( 
          <span className="cart-count">{draftPoolCount}</span>
        )}
      </div>
      <Container>
        <h3>Список карт</h3>
        <form className="find-button" onSubmit={handleSearch}>
          <Row className="justify-content-center align-items-center">
            <Col xs={12} sm={8} md={6} lg={4} className="search-field">
              <FormControl
                type="text"
                placeholder="Поиск по названию"
                value={searchTerm}
                onChange={handleInputChange}
                className="mb-2"
              />
            </Col>
            <Col xs="auto">
              <Button type="submit" variant="primary" className='search-button'>
                Поиск
              </Button>
            </Col>
          </Row>
        </form>
        <Row className="map-container mt-4">
          {maps.length > 0 ? (
            maps.map((map) => (
              <Col
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={map.id}
                className="map-item mb-4"
              >
                <Link to={`/maps/${map.id}`}>
                  <Image
                    src={map.image_url ? map.image_url : defaultImageUrl}
                    alt={map.title}
                    fluid
                    rounded
                    className="map-image"
                  />
                  <p>{map.title}</p>
                </Link>
                {isAuthenticated && ( 
                  <Button
                    variant="success"
                    onClick={() => addToDraft(map.id)}
                    className="mt-2"
                  >
                    Добавить в пул карт
                  </Button>
                )}
              </Col>
            ))
          ) : (
            <p>{error || 'Нет доступных карт'}</p>
          )}
        </Row>
      </Container>
    </>
  );
};

export default MapList;
