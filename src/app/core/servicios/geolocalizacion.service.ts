import { Injectable } from '@angular/core';

export interface Posicion {
  lat: number;
  lng: number;
}

/** Envuelve navigator.geolocation en una promesa con mensajes en español. */
@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {
  obtenerPosicion({ altaPrecision = false }: { altaPrecision?: boolean } = {}): Promise<Posicion> {
    return new Promise((resolver, rechazar) => {
      if (!navigator.geolocation) {
        rechazar(new Error('Tu navegador no permite compartir la ubicación.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (posicion) => resolver({ lat: posicion.coords.latitude, lng: posicion.coords.longitude }),
        (error) => {
          rechazar(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? 'No nos diste permiso para acceder a tu ubicación. Podés escribir la dirección a mano.'
                : 'No pudimos obtener tu ubicación. Podés escribir la dirección a mano.',
            ),
          );
        },
        { enableHighAccuracy: altaPrecision, timeout: 10000 },
      );
    });
  }
}
