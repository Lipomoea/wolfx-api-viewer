class UnionFind {
    constructor(elements, adjacencyMatrix) {
        this.parent = {};
        this.rank = {};

        elements.forEach(element => {
            this.parent[element] = element;
            this.rank[element] = 0;
        });

        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) { // j从i+1开始
                if (adjacencyMatrix[i][j] == true) {
                    this.union(elements[i], elements[j]);
                }
            }
        }
    }

    find(element) {
        if (this.parent[element] !== element) {
            this.parent[element] = this.find(this.parent[element]); // Path compression
        }
        return this.parent[element];
    }

    union(element1, element2) {
        let root1 = this.find(element1);
        let root2 = this.find(element2);

        if (root1 !== root2) {
            if (this.rank[root1] > this.rank[root2]) {
                this.parent[root2] = root1;
            } else if (this.rank[root1] < this.rank[root2]) {
                this.parent[root1] = root2;
            } else {
                this.parent[root2] = root1;
                this.rank[root1]++;
            }
        }
    }

    getSetId(element) {
        return this.find(element);
    }

    getAllSetIds() {
        let sets = {};
        for (let element in this.parent) {
            let setId = this.find(element);
            if (!sets[setId]) {
                sets[setId] = [];
            }
            sets[setId].push(element);
        }
        return sets;
    }

    getAssociatedElements(){
        let elements = []
        let sets = this.getAllSetIds()
        for(let setId in sets){
            if(sets[setId].length > 1){
                elements = elements.concat(sets[setId])
            }
        }
        return elements
    }
}

export { UnionFind }