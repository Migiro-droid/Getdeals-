// depots.ts - Manage depots (stores/outlets) in Leta

import { LetaClient } from './client';
import { LetaDepot, LetaLocation } from './types';

export class LetaDepotsService {
  private client: LetaClient;

  constructor(client: LetaClient) {
    this.client = client;
  }

  /**
   * Create a new depot (store/outlet)
   */
  async create(depotData: {
    name: string;
    code: string;
    location: LetaLocation;
    pickup_geofence_type?: 'soft' | 'hard';
    pickup_geofence_radius?: number;
    dropoff_geofence_type?: 'soft' | 'hard';
    dropoff_geofence_radius?: number;
    order_pickup_ready?: boolean;
    restricted_radius?: number;
    order_wait_time?: number;
    max_orders?: number;
  }): Promise<LetaDepot> {
    console.log(`🏪 Creating depot: ${depotData.code}`);

    const response = await this.client.post('/depots/create/', {
      name: depotData.name,
      code: depotData.code,
      location: {
        latitude: depotData.location.latitude,
        longitude: depotData.location.longitude,
        name: depotData.location.name,
      },
      pickup_geofence_type: depotData.pickup_geofence_type || 'soft',
      pickup_geofence_radius: depotData.pickup_geofence_radius || 500,
      dropoff_geofence_type: depotData.dropoff_geofence_type || 'soft',
      dropoff_geofence_radius: depotData.dropoff_geofence_radius || 500,
      order_pickup_ready: depotData.order_pickup_ready || false,
      restricted_radius: depotData.restricted_radius || 1000,
      order_wait_time: depotData.order_wait_time || 15,
      max_orders: depotData.max_orders || 1,
    });

    console.log(`✅ Depot created: ${depotData.code}`, response);
    return response;
  }

  /**
   * Update an existing depot
   */
  async update(
    depotCode: string,
    depotData: Partial<{
      name: string;
      location: LetaLocation;
      pickup_geofence_type: 'soft' | 'hard';
      pickup_geofence_radius: number;
      dropoff_geofence_type: 'soft' | 'hard';
      dropoff_geofence_radius: number;
      order_pickup_ready: boolean;
      restricted_radius: number;
      order_wait_time: number;
      max_orders: number;
    }>
  ): Promise<LetaDepot> {
    console.log(`🏪 Updating depot: ${depotCode}`);

    const updatePayload: any = {};

    if (depotData.name) updatePayload.name = depotData.name;
    if (depotData.location) {
      updatePayload.location = {
        latitude: depotData.location.latitude,
        longitude: depotData.location.longitude,
        name: depotData.location.name,
      };
    }
    if (depotData.pickup_geofence_type) updatePayload.pickup_geofence_type = depotData.pickup_geofence_type;
    if (depotData.pickup_geofence_radius) updatePayload.pickup_geofence_radius = depotData.pickup_geofence_radius;
    if (depotData.dropoff_geofence_type) updatePayload.dropoff_geofence_type = depotData.dropoff_geofence_type;
    if (depotData.dropoff_geofence_radius) updatePayload.dropoff_geofence_radius = depotData.dropoff_geofence_radius;
    if (depotData.order_pickup_ready !== undefined) updatePayload.order_pickup_ready = depotData.order_pickup_ready;
    if (depotData.restricted_radius) updatePayload.restricted_radius = depotData.restricted_radius;
    if (depotData.order_wait_time) updatePayload.order_wait_time = depotData.order_wait_time;
    if (depotData.max_orders) updatePayload.max_orders = depotData.max_orders;

    const response = await this.client.put(`/depots/${depotCode}/update/`, updatePayload);

    console.log(`✅ Depot updated: ${depotCode}`, response);
    return response;
  }

  /**
   * Get depot details
   */
  async get(depotCode: string): Promise<LetaDepot> {
    console.log(`🏪 Fetching depot: ${depotCode}`);

    const response = await this.client.get(`/depots/${depotCode}/`);
    return response;
  }

  /**
   * List all depots
   */
  async list(): Promise<LetaDepot[]> {
    console.log('🏪 Fetching all depots');

    const response = await this.client.get('/depots/');
    return response;
  }

  /**
   * Delete a depot
   */
  async delete(depotCode: string): Promise<{ success: boolean; message: string }> {
    console.log(`🏪 Deleting depot: ${depotCode}`);

    const response = await this.client.delete(`/depots/${depotCode}/`);
    console.log(`✅ Depot deleted: ${depotCode}`);
    return response;
  }
}
