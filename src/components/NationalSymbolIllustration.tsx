import React from 'react';
import flagImg from '../assets/images/colombian_flag_1788802369350.jpg';
import coatArmsImg from '../assets/images/colombian_coat_arms_1788802385357.jpg';
import anthemImg from '../assets/images/colombian_anthem_1788802405660.jpg';
import sombreroImg from '../assets/images/sombrero_vueltiao_1788802903906.jpg';
import juanValdezImg from '../assets/images/colombian_coffee_valdez_1788869045809.jpg';
import coffeeBeansImg from '../assets/images/colombian_coffee_beans_1788869783267.jpg';
import tejoImg from '../assets/images/colombian_tejo_1788802923236.jpg';
import orchidImg from '../assets/images/colombian_orchid_1788802860142.jpg';
import waxPalmImg from '../assets/images/colombian_wax_palm_1788802875718.jpg';
import condorImg from '../assets/images/colombian_condor_1788802888813.jpg';

export type ColombianSymbolType =
  | 'flag'
  | 'coat-of-arms'
  | 'anthem'
  | 'sombrero-vueltiao'
  | 'juan-valdez'
  | 'coffee'
  | 'colombian-coffee'
  | 'tejo'
  | 'orchid'
  | 'wax-palm'
  | 'condor';

interface NationalSymbolIllustrationProps {
  symbolType: ColombianSymbolType | string;
  className?: string;
  altText?: string;
}

export const NationalSymbolIllustration: React.FC<NationalSymbolIllustrationProps> = ({
  symbolType,
  className = 'w-24 h-24 sm:w-28 sm:h-28',
  altText,
}) => {
  let imageSrc = flagImg;
  let defaultAlt = 'National Flag of Colombia (Bandera de Colombia)';

  switch (symbolType) {
    case 'coat-of-arms':
      imageSrc = coatArmsImg;
      defaultAlt = 'National Coat of Arms of Colombia (Escudo de Colombia)';
      break;
    case 'anthem':
      imageSrc = anthemImg;
      defaultAlt = 'National Anthem of Colombia (Himno Nacional de Colombia)';
      break;
    case 'sombrero-vueltiao':
      imageSrc = sombreroImg;
      defaultAlt = 'Cultural Symbol: Sombrero Vueltiao Zenú';
      break;
    case 'juan-valdez':
      imageSrc = juanValdezImg;
      defaultAlt = 'Cultural Symbol: Juan Valdez and Mule Conchita';
      break;
    case 'coffee':
    case 'colombian-coffee':
      imageSrc = coffeeBeansImg;
      defaultAlt = 'Cultural Symbol: Colombian Coffee Plant & Beans';
      break;
    case 'tejo':
      imageSrc = tejoImg;
      defaultAlt = 'National Sport of Colombia: Tejo (Turmequé)';
      break;
    case 'orchid':
      imageSrc = orchidImg;
      defaultAlt = 'National Flower of Colombia: Cattleya Trianae Orchid';
      break;
    case 'wax-palm':
      imageSrc = waxPalmImg;
      defaultAlt = 'National Tree of Colombia: Quindío Wax Palm (Palma de Cera)';
      break;
    case 'condor':
      imageSrc = condorImg;
      defaultAlt = 'National Bird of Colombia: Andean Condor (Cóndor de los Andes)';
      break;
    case 'flag':
    default:
      imageSrc = flagImg;
      defaultAlt = 'National Flag of Colombia (Bandera de Colombia)';
      break;
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300/80 shadow-md bg-stone-100 transition-transform duration-200 hover:scale-102">
        <img
          src={imageSrc}
          alt={altText || defaultAlt}
          referrerPolicy="no-referrer"
          className={`${className} object-cover block`}
          loading="eager"
        />
        <div className="absolute inset-0 ring-1 ring-black/5 rounded-2xl pointer-events-none" />
      </div>
    </div>
  );
};

