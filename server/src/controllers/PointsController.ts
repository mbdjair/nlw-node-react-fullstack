import { Request, Response } from "express";
import knex from '../database/connection'

class PointsController {
    async create(request: Request, response: Response) {

        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            uf,
            city,
            items
        } = request.body;

        const trx = await knex.transaction();

        const point = {
            image: 'https://images.unsplash.com/photo-1504244648668-89000185ea9b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            uf,
            city
        };

        const point_id = (await trx('points').insert(point))[0];


        const pointsItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id
            };
        });

        await trx('points_items').insert(pointsItems);

        trx.commit();

        return response.json({
            point_id,
            ...point,
            items
        });
    }

    async show(request: Request, response: Response) {
        const { id } = request.params;

        const point = await knex('points').select('*').where('id', id).first();

        if (!point) {
            return response.status(400).json({ message: 'Point not found.' })
        }

        const items = await knex('items')
            .join('points_items', 'items.id', 'points_items.item_id')
            .select('items.title')
            .where('points_items.point_id', id);

        return response.json({
            ...point,
            items
        });
    }


    async index(request: Request, response: Response) {

        const { city, uf, items } = request.query;
        const parsedItems = String(items)
            .split(',')
            .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('points_items', 'points.id', 'points_items.point_id')
            .whereIn('points_items.item_id', parsedItems)
            .where('points.city', String(city))
            .where('points.uf', String(uf))
            .distinct()
            .select('points.*');

        if (!points) {
            return response.status(400).json({ message: 'Point not found.' })
        }

        return response.json(points);
    }
}

export default PointsController;