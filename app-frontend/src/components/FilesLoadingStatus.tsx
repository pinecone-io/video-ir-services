import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { Mesh, Group } from 'three';

import { GetImagesDTO } from '../types/Box';

const MyBox = ({
    key,
    boxSize,
    spacing,
    cols,
    rows,
    colIndex,
    rowIndex,
    image
}: {
    key: string,
    boxSize: number,
    spacing: number,
    cols: number,
    rows: number,
    colIndex: number,
    rowIndex: number,
    image: GetImagesDTO[keyof GetImagesDTO]
}) => {
    const meshRef = useRef<Mesh>();

    // Function to update scale
    const updateMeshScale = (hover: boolean) => {
        if (!meshRef.current) return;

        const scale = hover ? 1.1 : 1;
        meshRef.current.scale.set(scale, scale, scale);
    };

    // Set color based on image presence
    const color = image ? 0x00ff00 : 'grey'; // Green if image is truthy, grey otherwise

    useEffect(() => {
        if (!meshRef.current) return;
        const color = image ? 0x00ff00 : 'grey';
        (meshRef.current.material as THREE.MeshStandardMaterial).color.set(color);
    }, [color]);

    return (
        <Box
            ref={meshRef}
            key={key}
            args={[boxSize, boxSize, boxSize]}
            position={[
                (colIndex - cols / 2) * (boxSize + spacing) + boxSize / 2,
                (rowIndex - rows / 2) * (boxSize + spacing) + boxSize / 2,
                0
            ]}
            castShadow
            receiveShadow
            onPointerOver={() => updateMeshScale(true)}
            onPointerOut={() => updateMeshScale(false)}
        />
    );
};

export default MyBox;

interface GridProps {
    cols: number;
    rows: number;
    imagePaths: GetImagesDTO;
}

const Grid: React.FC<GridProps> = ({ cols, rows, imagePaths }) => {
    const groupRef = useRef<Group>(null);
    const { viewport } = useThree();

    const renderGrid = () => {
        const elements = [];
        const boxSize = Math.min(viewport.width / cols, viewport.height / rows);
        const spacing = 0.1 * boxSize;  // Adjust spacing relative to box size

        for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
            for (let colIndex = 0; colIndex < cols; colIndex++) {
                const index = rowIndex * cols + colIndex;
                const key = Object.keys(imagePaths)[index];
                const image = imagePaths[key];

                if (key) {
                    elements.push(
                        <MyBox
                            key={key}
                            boxSize={boxSize}
                            spacing={spacing}
                            cols={cols}
                            rows={rows}
                            colIndex={colIndex}
                            rowIndex={rowIndex}
                            image={image}
                        />
                    );
                }
            }
        }
        return elements;
    };

    return (
        <group ref={groupRef}>
            {renderGrid()}
        </group>
    );
};


const FilesLoadingStatus: React.FC<{ cols: number, rows: number, imagePaths: GetImagesDTO }> = (props) => {
    return (
        <Canvas>
            <Grid {...props} />
        </Canvas>
    );
};
export { FilesLoadingStatus }