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
      name: 'São Paulo',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
      label: 'São Paulo - SP',
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
      id: 'recife-pe',
      name: 'Recife',
      city: 'Recife',
      state: 'PE',
      country: 'Brasil',
      label: 'Recife - PE',
      slug: 'recife-pe',
    },
    {
      id: 'campinas-sp',
      name: 'Campinas',
      city: 'Campinas',
      state: 'SP',
      country: 'Brasil',
      label: 'Campinas - SP',
      slug: 'campinas-sp',
    },
    {
      id: 'porto-alegre-rs',
      name: 'Porto Alegre',
      city: 'Porto Alegre',
      state: 'RS',
      country: 'Brasil',
      label: 'Porto Alegre - RS',
      slug: 'porto-alegre-rs',
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
