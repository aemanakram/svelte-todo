<script>
  import { onMount } from "svelte";
  import MineIcon from "./mine_icon.svelte";

  const fieldSize = 10;
  const mineCount = 10;

  let gameover = false;
  let win = false;
  let minefield = [];

  const setupField = (size, mineCount) => {
    gameover = false;
    win = false;

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

    field = addMines(field, mineCount);
    field = countMineNeighbors(field);
    return field;
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

  const checkWin = () => {
    let count = 0;
    for (let i = 0; i < fieldSize; i++) {
      for (let j = 0; j < fieldSize; j++) {
        if (minefield[i][j].isRevealed) {
          count++;
        }
      }
    }
    if (count == fieldSize * fieldSize - mineCount) {
      return true;
    }
    return false;
  };

  const revealMine = (mine) => {
    if (gameover) return;
    if (mine.isRevealed) return;

    revealNeighbors(mine);

    if (mine.isMine) {
      gameover = true;
      minefield = [...minefield];
      return;
    }

    if (checkWin()) {
      win = true;
      gameover = true;
    }
    minefield = [...minefield];
  };

  const revealNeighbors = (mine) => {
    if (mine.isRevealed) return;
    mine.isRevealed = true;

    if (mine.mineNeighbors == 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (
            mine.x + i >= 0 &&
            mine.x + i < fieldSize &&
            mine.y + j >= 0 &&
            mine.y + j < fieldSize
          ) {
            revealNeighbors(minefield[mine.x + i][mine.y + j]);
          }
        }
      }
    }
  };

  onMount(() => {
    minefield = setupField(fieldSize, mineCount);
  });
</script>

<main>
  <div class="container">
    <div class="status-bar">
      <button
        class="reset-button"
        on:click={() => {
          minefield = setupField(fieldSize, mineCount);
        }}>RESET</button
      >
      <div class="status">
        {#if gameover}
          {#if win}
            You win!
          {:else}
            You lose!
          {/if}
        {:else}
          Minesweeper
        {/if}
      </div>
    </div>

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
            {#if mine.isRevealed && mine.isMine}
              <MineIcon />
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 1rem;
  }

  .status {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    font-size: 1.5rem;
    font-weight: bold;
    text-align: center;
    color: white;
  }

  .row {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    height: fit-content;
  }

  .field {
    background-color: lightgray;
    width: 4rem;
    height: 4rem;
    margin: 0px;
    border-color: white;
    font-size: 0;
  }

  .field.open {
    pointer-events: none;
    border-color: white;
    background-color: #fff;
    font-size: 1.5rem;
  }

  .field.mine.open {
    pointer-events: none;
    border-color: white;
    background-color: red;
    font-size: 0;
  }

  .reset-button {
    background-color: #fff;
    border-radius: 5px;
    padding: 0.5rem;
    margin: 0.5rem;
  }

  .reset-button:hover {
    background-color: #eee;
  }

  .reset-button:active {
    background-color: #ddd;
  }
</style>
