<?php

namespace App\Repositories;

use App\Repositories\Contracts\RepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

abstract class BaseRepository implements RepositoryInterface
{
    protected Model $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    public function all(array $columns = ['*'])
    {
        return $this->model->all($columns);
    }

    public function paginate(int $perPage = 15, array $columns = ['*'])
    {
        return $this->model->paginate($perPage, $columns);
    }

    public function create(array $data)
    {
        return $this->model->create($data);
    }

    public function update(array $data, $id)
    {
        $record = $this->find($id);
        if ($record) {
            $record->update($data);
            return $record;
        }
        return false;
    }

    public function delete($id)
    {
        $record = $this->find($id);
        if ($record) {
            return $record->delete();
        }
        return false;
    }

    public function find($id, array $columns = ['*'])
    {
        return $this->model->find($id, $columns);
    }

    public function findBy(string $field, $value, array $columns = ['*'])
    {
        return $this->model->where($field, $value)->first($columns);
    }

    /**
     * Get a new query builder for the model's table.
     */
    public function query(): Builder
    {
        return $this->model->newQuery();
    }
}
