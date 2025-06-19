import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  aspectRatio?: '1:1' | '4:5' | '1.91:1';
  name?: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  onOpenLightbox?: (idx: number) => void;
  currentIndex?: number;
}

const aspectClass = (aspect: MediaItem['aspectRatio']) => {
  switch (aspect) {
    case '1:1': return 'aspect-square';
    case '4:5': return 'aspect-[4/5]';
    case '1.91:1': return 'aspect-[1.91/1]';
    default: return 'aspect-square';
  }
};

const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, onOpenLightbox }) => {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      navigation
      pagination={{ clickable: true }}
      className="w-full"
      style={{ maxWidth: '100%', maxHeight: 400 }}
    >
      {media.map((item, idx) => (
        <SwiperSlide key={item.url}>
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={`Imagen ${idx + 1}`}
              className={`w-full object-cover border border-gray-200 dark:border-gray-800 cursor-pointer ${aspectClass(item.aspectRatio)}`}
              onClick={() => onOpenLightbox && onOpenLightbox(idx)}
            />
          ) : item.type === 'video' ? (
            <video
              src={item.url}
              controls
              className={`w-full object-cover border border-gray-200 dark:border-gray-800 ${aspectClass(item.aspectRatio)}`}
            />
          ) : null}
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default MediaCarousel;
