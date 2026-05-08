<?php
/* [NEW] HandlesInterpolation.php */
namespace App\Traits;

use Illuminate\Support\Arr;

trait HandlesInterpolation
{
    /**
     * Resolve placeholders like {{ $inputs.node_id.key }} in a string or array.
     *
     * @param mixed $content The string or array containing placeholders
     * @param array $context The data context (e.g., ['inputs' => $previousOutputs])
     * @return mixed
     */
    protected function interpolate($content, array $context)
    {
        if (is_array($content)) {
            foreach ($content as $key => $value) {
                $content[$key] = $this->interpolate($value, $context);
            }
            return $content;
        }

        if (!is_string($content)) {
            return $content;
        }

        // Match {{ ... }}
        return preg_replace_callback('/{{\s*(.+?)\s*}}/', function ($matches) use ($context) {
            $path = trim($matches[1]);
            
            // Remove leading $ if present (e.g., $inputs.foo -> inputs.foo)
            $path = ltrim($path, '$');
            
            // Use Laravel's Arr::get for dot notation support
            $value = Arr::get($context, $path);
            
            if ($value === null) {
                return $matches[0]; // Return original if not found
            }
            
            if (is_array($value) || is_object($value)) {
                return json_encode($value);
            }
            
            return (string)$value;
        }, $content);
    }
}
