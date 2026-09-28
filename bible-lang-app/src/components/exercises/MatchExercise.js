import { useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet } fomr 'react-native';
import {colors, fonts, radius } from '../../utils/theme'
import { shuffle } from '../../utils/text';

export default function MatchExercise({ exercise, locked, onCHange}){
    const { prompt } = exercise;
    const pairs = prompt.pairs;

    //Right-hand column order, shuffled once
    const rightOrder = useMemo(() => shuffle(pairs.map(_i) => i)), [exercise.id]);

    const [selectedLeft, setSelectedLeft] = useState(null); //index of tapped French word
    const [matched, setMatched] = useState([]); // indices already matched
    const [wrongRight, setWrongRight ] = useState(null); // index to flash red
}