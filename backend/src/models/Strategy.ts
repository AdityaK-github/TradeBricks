import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: any;
}

export interface IConnection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface IStrategy extends Document {
    name: string;
    description: string;
    userId: string;
    blocks: IBlock[];
    connections: IConnection[];
    createdAt: Date;
    updatedAt: Date;
}

const StrategySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        userId: { type: String, required: true },
        blocks: [
            {
                id: { type: String, required: true },
                type: { type: String, required: true },
                position: {
                    x: { type: Number, required: true },
                    y: { type: Number, required: true },
                },
                data: { type: Schema.Types.Mixed },
            },
        ],
        connections: [
            {
                id: { type: String, required: true },
                source: { type: String, required: true },
                target: { type: String, required: true },
                sourceHandle: { type: String },
                targetHandle: { type: String },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model<IStrategy>('Strategy', StrategySchema); 