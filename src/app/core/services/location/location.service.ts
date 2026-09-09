import { Injectable } from '@angular/core';

export interface SpectrumLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  label: string;
  slug: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private readonly locations: SpectrumLocation[] = [
    {
      id: 'sao-paulo-sp',
      name: 'Sao Paulo',
      city: 'Sao Paulo',
      state: 'SP',
      country: 'Brasil',
      label: 'Sao Paulo - SP',
      slug: 'sao-paulo-sp',
    },
    {
      id: 'guarulhos-sp',
      name: 'Guarulhos',
      city: 'Guarulhos',
      state: 'SP',
      country: 'Brasil',
      label: 'Guarulhos - SP',
      slug: 'guarulhos-sp',
    },
    {
      id: 'xique-xique-ba',
      name: 'Xique-Xique',
      city: 'Xique-Xique',
      state: 'BA',
      country: 'Brasil',
      label: 'Xique-Xique - BA',
      slug: 'xique-xique-ba',
    },
    {
      id: 'feira-de-santana-ba',
      name: 'Feira de Santana',
      city: 'Feira de Santana',
      state: 'BA',
      country: 'Brasil',
      label: 'Feira de Santana - BA',
      slug: 'feira-de-santana-ba',
    },
    {
      id: 'barreirinhas-ma',
      name: 'Barreirinhas',
      city: 'Barreirinhas',
      state: 'MA',
      country: 'Brasil',
      label: 'Barreirinhas - MA',
      slug: 'barreirinhas-ma',
    },
  ];

  getLocations(): SpectrumLocation[] {
    return this.locations.map((location) => ({ ...location }));
  }

  searchLocations(term: string): SpectrumLocation[] {
    const normalizedTerm = this.normalize(term);

    if (!normalizedTerm) {
      return this.getLocations();
    }

    return this.locations
      .filter((location) =>
        [location.name, location.city, location.state, location.country, location.label]
          .map((value) => this.normalize(value))
          .some((value) => value.includes(normalizedTerm)),
      )
      .map((location) => ({ ...location }));
  }

  findBySlug(slug: string): SpectrumLocation | null {
    const normalizedSlug = slug.trim().toLowerCase();
    const location = this.locations.find((item) => item.slug === normalizedSlug);

    return location ? { ...location } : null;
  }

  normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
