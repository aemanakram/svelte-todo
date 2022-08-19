<script>
  import { onMount } from "svelte";

  const fieldSize = 10;
  let gameover = false;
  let minefield = [];

  const revealMine = (mine) => {
    if (gameover) return;

    if (mine.isRevealed) return;

    mine.isRevealed = true;

    if (mine.isMine) {
      gameover = true;
      minefield = [...minefield];
      return;
    }
    if (mine.mineNeighbors == 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (
            mine.x + i >= 0 &&
            mine.x + i < fieldSize &&
            mine.y + j >= 0 &&
            mine.y + j < fieldSize
          ) {
            revealMine(minefield[mine.x + i][mine.y + j]);
          }
        }
      }
    }
    minefield = [...minefield];
  };

  const addMines = (field) => {
    let mines = 0;
    while (mines < (fieldSize * fieldSize) / 10) {
      const x = Math.floor(Math.random() * fieldSize);
      const y = Math.floor(Math.random() * fieldSize);
      if (!field[x][y].isMine) {
        field[x][y].isMine = true;
        mines++;
      }
    }
    return field;
  };

  const countMineNeighbors = (field) => {
    for (let i = 0; i < fieldSize; i++) {
      for (let j = 0; j < fieldSize; j++) {
        if (field[i][j].isMine) {
          for (let k = -1; k <= 1; k++) {
            for (let l = -1; l <= 1; l++) {
              if (
                i + k >= 0 &&
                i + k < fieldSize &&
                j + l >= 0 &&
                j + l < fieldSize
              ) {
                field[i + k][j + l].mineNeighbors++;
              }
            }
          }
        }
      }
    }
    return field;
  };

  const setupField = (size) => {
    gameover = false;
    let field = [];
    for (let i = 0; i < size; i++) {
      field[i] = [];
      for (let j = 0; j < size; j++) {
        field[i][j] = {
          x: i,
          y: j,
          isMine: false,
          isRevealed: false,
          mineNeighbors: 0,
        };
      }
    }

    field = addMines(field, size);
    field = countMineNeighbors(field);
    return field;
  };

  onMount(() => {
    minefield = setupField(fieldSize);
  });
</script>

<main>
  <div class="container">
    <button
      class="reset-button"
      on:click={() => {
        minefield = setupField(fieldSize);
      }}>RESET</button
    >
    <!-- Display minefield as grid of buttons -->
    {#each minefield as minerow}
      <div class="row">
        {#each minerow as mine}
          <button
            class="field {mine.isRevealed ? 'open' : ''} {mine.isMine
              ? 'mine'
              : ''}"
            on:click={() => revealMine(mine)}
          >
            {#if mine.isMine}
              💣
            {:else}
              {mine.mineNeighbors ? mine.mineNeighbors : ""}
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</main>

<style>
  main {
    display: grid;
    grid-template-rows: repeat(10, 1fr);
  }

  .row {
    display: flex;
  }

  .field {
    background-color: lightgray;
    width: 4rem;
    height: 4rem;
    margin: 0px;
    font-size: 0px;
  }

  .field.open {
    pointer-events: none;
    background-color: #fff;
    font-size: 1.5rem;
  }

  .field.mine.open {
    background-color: #f00;
  }

  .reset-button {
    background-color: #fff;
    border: 1px solid #000;
    border-radius: 5px;
    padding: 0.5rem;
    margin: 0.5rem;
  }
</style>
